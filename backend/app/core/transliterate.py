"""Devanagari → Roman transliteration for Nepali text."""

import re

# Independent vowels (used at the start of a word or after another vowel)
_VOWELS: dict[str, str] = {
    "अ": "a",
    "आ": "a",
    "इ": "i",
    "ई": "i",
    "उ": "u",
    "ऊ": "u",
    "ऋ": "ri",
    "ए": "e",
    "ऐ": "ai",
    "ओ": "o",
    "औ": "au",
    "अं": "an",
    "अः": "ah",
}

# Vowel matras (diacritics that replace the inherent 'a')
_MATRAS: dict[str, str] = {
    "\u093e": "a",  # ा
    "\u093f": "i",  # ि
    "\u0940": "i",  # ी
    "\u0941": "u",  # ु
    "\u0942": "u",  # ू
    "\u0943": "ri",  # ृ
    "\u0947": "e",  # े
    "\u0948": "ai",  # ै
    "\u094b": "o",  # ो
    "\u094c": "au",  # ौ
}

# Consonants → phonetic Roman equivalent (includes inherent 'a')
_CONSONANTS: dict[str, str] = {
    "क": "ka",
    "ख": "kha",
    "ग": "ga",
    "घ": "gha",
    "ङ": "nga",
    "च": "cha",
    "छ": "chha",
    "ज": "ja",
    "झ": "jha",
    "ञ": "nya",
    "ट": "ta",
    "ठ": "tha",
    "ड": "da",
    "ढ": "dha",
    "ण": "na",
    "त": "ta",
    "थ": "tha",
    "द": "da",
    "ध": "dha",
    "न": "na",
    "प": "pa",
    "फ": "pha",
    "ब": "ba",
    "भ": "bha",
    "म": "ma",
    "य": "ya",
    "र": "ra",
    "ल": "la",
    "व": "wa",
    "श": "sha",
    "ष": "sha",
    "स": "sa",
    "ह": "ha",
    "क्ष": "ksha",
    "त्र": "tra",
    "ज्ञ": "gya",
}

# Nukta consonants (used in loan words)
_NUKTA_CONSONANTS: dict[str, str] = {
    "क़": "ka",
    "ख़": "kha",
    "ग़": "ga",
    "ज़": "za",
    "ड़": "da",
    "ढ़": "dha",
    "फ़": "fa",
}

# Special characters
_VIRAMA = "\u094d"  # ् (halant)
_ANUSVARA = "\u0902"  # ं
_CHANDRABINDU = "\u0901"  # ँ
_VISARGA = "\u0903"  # ः

# Devanagari digits
_DIGITS: dict[str, str] = {
    "०": "0",
    "१": "1",
    "२": "2",
    "३": "3",
    "४": "4",
    "५": "5",
    "६": "6",
    "७": "7",
    "८": "8",
    "९": "9",
}

# Devanagari punctuation
_PUNCTUATION: dict[str, str] = {
    "।": ".",
    "॥": ".",
}

_DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]+")


def _is_devanagari(text: str) -> bool:
    """Check if text contains any Devanagari characters."""
    return bool(_DEVANAGARI_RE.search(text))


def _transliterate_word(word: str) -> tuple[str, bool, bool]:
    """Transliterate a single Devanagari word to Roman script.

    Returns (roman_text, ends_with_inherent_a, is_conjunct_ending):
    - ends_with_inherent_a: True if the word ends with a consonant's inherent 'a'
    - is_conjunct_ending: True if that final consonant follows a virama (conjunct)
    """
    result: list[str] = []
    i = 0
    length = len(word)
    ends_with_inherent_a = False
    is_conjunct_ending = False
    after_virama = False

    while i < length:
        char = word[i]

        # Devanagari digits
        if char in _DIGITS:
            result.append(_DIGITS[char])
            i += 1
            ends_with_inherent_a = False
            after_virama = False
            continue

        # Punctuation
        if char in _PUNCTUATION:
            result.append(_PUNCTUATION[char])
            i += 1
            ends_with_inherent_a = False
            after_virama = False
            continue

        # Check for two-character conjuncts (क्ष, त्र, ज्ञ) before single consonants
        if i + 2 < length and word[i : i + 3] in _CONSONANTS:
            consonant = _CONSONANTS[word[i : i + 3]]
            i += 3
            # Check if followed by virama (strip inherent 'a')
            if i < length and word[i] == _VIRAMA:
                result.append(consonant[:-1])
                i += 1
                after_virama = True
                ends_with_inherent_a = False
            # Check if followed by a matra (replace inherent 'a')
            elif i < length and word[i] in _MATRAS:
                result.append(consonant[:-1] + _MATRAS[word[i]])
                i += 1
                after_virama = False
                ends_with_inherent_a = False
            else:
                result.append(consonant)
                # These 3-char sequences are inherently conjuncts (contain virama)
                is_conjunct_ending = True
                ends_with_inherent_a = True
                after_virama = False
            continue

        # Nukta consonants (base + nukta combining char)
        if i + 1 < length and word[i : i + 2] in _NUKTA_CONSONANTS:
            consonant = _NUKTA_CONSONANTS[word[i : i + 2]]
            i += 2
            if i < length and word[i] == _VIRAMA:
                result.append(consonant[:-1])
                i += 1
                after_virama = True
                ends_with_inherent_a = False
            elif i < length and word[i] in _MATRAS:
                result.append(consonant[:-1] + _MATRAS[word[i]])
                i += 1
                after_virama = False
                ends_with_inherent_a = False
            else:
                result.append(consonant)
                is_conjunct_ending = after_virama
                ends_with_inherent_a = True
                after_virama = False
            continue

        # Regular consonant
        if char in _CONSONANTS:
            consonant = _CONSONANTS[char]
            i += 1
            # Virama: consonant cluster, strip inherent 'a'
            if i < length and word[i] == _VIRAMA:
                result.append(consonant[:-1])
                i += 1
                after_virama = True
                ends_with_inherent_a = False
            # Matra: replace inherent 'a' with the matra vowel
            elif i < length and word[i] in _MATRAS:
                result.append(consonant[:-1] + _MATRAS[word[i]])
                i += 1
                after_virama = False
                ends_with_inherent_a = False
            else:
                result.append(consonant)
                is_conjunct_ending = after_virama
                ends_with_inherent_a = True
                after_virama = False
            continue

        # Independent vowels
        if char in _VOWELS:
            result.append(_VOWELS[char])
            i += 1
            ends_with_inherent_a = False
            after_virama = False
            continue

        # Anusvara
        if char == _ANUSVARA:
            result.append("n")
            i += 1
            ends_with_inherent_a = False
            after_virama = False
            continue

        # Chandrabindu
        if char == _CHANDRABINDU:
            result.append("n")
            i += 1
            ends_with_inherent_a = False
            after_virama = False
            continue

        # Visarga
        if char == _VISARGA:
            result.append("h")
            i += 1
            ends_with_inherent_a = False
            after_virama = False
            continue

        # Stray matra (shouldn't happen, but handle gracefully)
        if char in _MATRAS:
            result.append(_MATRAS[char])
            i += 1
            ends_with_inherent_a = False
            after_virama = False
            continue

        # Virama by itself
        if char == _VIRAMA:
            i += 1
            after_virama = True
            continue

        # Pass through any other character
        result.append(char)
        i += 1
        ends_with_inherent_a = False
        after_virama = False

    return "".join(result), ends_with_inherent_a, is_conjunct_ending


def _apply_schwa_deletion(roman: str, ends_with_inherent_a: bool, is_conjunct_ending: bool) -> str:
    """Apply Nepali schwa deletion: drop word-final inherent 'a'.

    Only deletes the final 'a' when:
    - It comes from a consonant's inherent 'a' (not from a matra like ा)
    - The consonant is NOT the last in a conjunct cluster (e.g. न्द्र)
      because stripping 'a' from conjuncts produces unpronounceable results.
    """
    if len(roman) <= 1:
        return roman
    if ends_with_inherent_a and not is_conjunct_ending:
        return roman[:-1]
    return roman


def transliterate(text: str) -> str:
    """Transliterate Devanagari text to Roman script.

    - Preserves already-Latin text segments
    - Applies Nepali schwa deletion on word-final 'a'
    - Title-cases the output
    """
    if not text or not text.strip():
        return ""

    # If no Devanagari at all, return as-is
    if not _is_devanagari(text):
        return text.strip()

    parts: list[str] = []
    last_end = 0

    for match in _DEVANAGARI_RE.finditer(text):
        start, end = match.span()

        # Preserve non-Devanagari text between matches
        if start > last_end:
            parts.append(text[last_end:start])

        dev_segment = match.group()
        roman, ends_with_inherent_a, is_conjunct_ending = _transliterate_word(dev_segment)
        roman = _apply_schwa_deletion(roman, ends_with_inherent_a, is_conjunct_ending)
        parts.append(roman)

        last_end = end

    # Append any trailing non-Devanagari text
    if last_end < len(text):
        parts.append(text[last_end:])

    result = "".join(parts).strip()

    # Normalize multiple spaces
    result = re.sub(r"\s+", " ", result)

    # Title case
    return result.title()
