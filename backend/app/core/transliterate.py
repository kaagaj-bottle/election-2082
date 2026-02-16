"""Devanagari → Roman transliteration for Nepali text."""

import re

# Independent vowels (used at the start of a word or after another vowel)
_VOWELS: dict[str, str] = {
    "अ": "a",
    "आ": "aa",
    "इ": "i",
    "ई": "ee",
    "उ": "u",
    "ऊ": "oo",
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
    "\u093e": "aa",  # ा
    "\u093f": "i",  # ि
    "\u0940": "ee",  # ी
    "\u0941": "u",  # ु
    "\u0942": "oo",  # ू
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


def _transliterate_word(word: str) -> str:
    """Transliterate a single Devanagari word to Roman script."""
    result: list[str] = []
    i = 0
    length = len(word)

    while i < length:
        char = word[i]

        # Devanagari digits
        if char in _DIGITS:
            result.append(_DIGITS[char])
            i += 1
            continue

        # Punctuation
        if char in _PUNCTUATION:
            result.append(_PUNCTUATION[char])
            i += 1
            continue

        # Check for two-character conjuncts (क्ष, त्र, ज्ञ) before single consonants
        if i + 2 < length and word[i : i + 3] in _CONSONANTS:
            consonant = _CONSONANTS[word[i : i + 3]]
            i += 3
            # Check if followed by virama (strip inherent 'a')
            if i < length and word[i] == _VIRAMA:
                result.append(consonant[:-1])
                i += 1
            # Check if followed by a matra (replace inherent 'a')
            elif i < length and word[i] in _MATRAS:
                result.append(consonant[:-1] + _MATRAS[word[i]])
                i += 1
            else:
                result.append(consonant)
            continue

        # Nukta consonants (base + nukta combining char)
        if i + 1 < length and word[i : i + 2] in _NUKTA_CONSONANTS:
            consonant = _NUKTA_CONSONANTS[word[i : i + 2]]
            i += 2
            if i < length and word[i] == _VIRAMA:
                result.append(consonant[:-1])
                i += 1
            elif i < length and word[i] in _MATRAS:
                result.append(consonant[:-1] + _MATRAS[word[i]])
                i += 1
            else:
                result.append(consonant)
            continue

        # Regular consonant
        if char in _CONSONANTS:
            consonant = _CONSONANTS[char]
            i += 1
            # Virama: consonant cluster, strip inherent 'a'
            if i < length and word[i] == _VIRAMA:
                result.append(consonant[:-1])
                i += 1
            # Matra: replace inherent 'a' with the matra vowel
            elif i < length and word[i] in _MATRAS:
                result.append(consonant[:-1] + _MATRAS[word[i]])
                i += 1
            else:
                result.append(consonant)
            continue

        # Independent vowels
        if char in _VOWELS:
            result.append(_VOWELS[char])
            i += 1
            continue

        # Anusvara
        if char == _ANUSVARA:
            result.append("n")
            i += 1
            continue

        # Chandrabindu
        if char == _CHANDRABINDU:
            result.append("n")
            i += 1
            continue

        # Visarga
        if char == _VISARGA:
            result.append("h")
            i += 1
            continue

        # Stray matra (shouldn't happen, but handle gracefully)
        if char in _MATRAS:
            result.append(_MATRAS[char])
            i += 1
            continue

        # Virama by itself
        if char == _VIRAMA:
            i += 1
            continue

        # Pass through any other character
        result.append(char)
        i += 1

    return "".join(result)


def _apply_schwa_deletion(roman: str) -> str:
    """Apply Nepali schwa deletion: drop word-final inherent 'a'.

    In Nepali, the inherent 'a' at the end of a word is typically silent.
    e.g., 'rama' → 'ram', 'kathamandu' → 'kathmandu'
    But don't delete after single-char syllables or if the word is just 'a'.
    """
    if len(roman) <= 1:
        return roman
    if roman.endswith("a") and not roman.endswith("aa"):
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
        roman = _transliterate_word(dev_segment)
        roman = _apply_schwa_deletion(roman)
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
