# Nepal Election 2082 — Candidate Data Sources & Extraction Plan

> **Election**: House of Representatives (प्रतिनिधि सभा), 2082 BS
> **Date**: 21 Falgun 2082 / March 5, 2026
> **Seats**: 275 total — 165 FPTP + 110 Proportional Representation
> **Total FPTP Candidates**: 3,406 across 165 constituencies, 66 parties
> **Total PR Candidates**: ~3,135 from 63 parties
> **Research Date**: February 16, 2026

---

## Table of Contents

1. [Source Summary Table](#1-source-summary-table)
2. [Official Sources (Election Commission)](#2-official-sources-election-commission)
3. [Community Portals](#3-community-portals)
4. [Open Source Projects & GitHub Repos](#4-open-source-projects--github-repos)
5. [Scraping Plan Per Source](#5-scraping-plan-per-source)
6. [Candidate Data Schema](#6-candidate-data-schema)
7. [PR Candidate PDF Extraction](#7-pr-candidate-pdf-extraction)
8. [Challenges & Recommendations](#8-challenges--recommendations)
9. [Sample Scraping Code](#9-sample-scraping-code)
10. [Recommended Architecture](#10-recommended-architecture)

---

## 1. Source Summary Table

| # | Source | URL | Data Type | Segment | Candidates | Quality | Priority |
|---|--------|-----|-----------|---------|------------|---------|----------|
| 1 | **result.election.gov.np (JSON)** | `result.election.gov.np/JSONFiles/ElectionResultCentral2082.txt` | JSON file | FPTP | 3,406 | **Excellent** | **P0** |
| 2 | **election.gov.np (PR PDF)** | `election.gov.np/.../PR/PR_FINAL.pdf` | PDF (137 pages) | PR | 3,135 | **Good** | **P0** |
| 3 | **election.gov.np (API)** | `election.gov.np/admin/public/api/` | REST API (JSON) | Metadata | N/A | Good | P1 |
| 4 | **election.ekantipur.com** | `election.ekantipur.com` | Embedded JS objects | FPTP | 3,406 | **Excellent** | P1 |
| 5 | **2082.live** | `2082.live/candidates` | Next.js SSR/RSC | FPTP | 3,406 | High | P2 |
| 6 | **chautarihub.com** | `chautarihub.com/en/election/candidates` | Next.js SSR | FPTP | 3,406 | High | P2 |
| 7 | **nepalelection.live** | `nepalelection.live/en/explore` | Next.js RSC | FPTP | 3,406 | Medium-High | P3 |
| 8 | **knowyourcandidate.nepabrita.com** | `knowyourcandidate.nepabrita.com/candidates/` | Next.js SSR | FPTP | Partial | Low | P4 |
| 9 | **Candidate Photos** | `result.election.gov.np/Images/Candidate/{ID}.jpg` | JPEG images | FPTP | 3,406 | Excellent | P0 |
| 10 | **election.gov.np (2079 Excel)** | `election.gov.np/.../ALL_CANDIDATE_HOR_2079_06_26_19_00.xlsx` | Excel | Historical | N/A | Reference | P5 |

---

## 2. Official Sources (Election Commission)

### 2.1 PRIMARY: FPTP Candidate JSON — result.election.gov.np

**This is the single most important data source.** It is a JSON file containing all 3,406 FPTP candidates.

```
URL: https://result.election.gov.np/JSONFiles/ElectionResultCentral2082.txt
Format: JSON array
Size: ~3,406 records
Auth: None (publicly accessible)
```

**Fields per record:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `CandidateID` | int | Unique ID | `339933` |
| `CandidateName` | string | Name (Nepali) | `"क्षितिज थेबे"` |
| `AGE_YR` | int | Age in years | `38` |
| `Gender` | string | Gender (Nepali) | `"पुरुष"` / `"महिला"` |
| `PoliticalPartyName` | string | Party name (Nepali) | `"नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)"` |
| `SYMBOLCODE` | int | Election symbol code | `2598` |
| `SymbolName` | string | Symbol name (Nepali) | `"सुर्य"` |
| `DistrictName` | string | District (Nepali) | `"ताप्लेजुङ"` |
| `StateName` | string | Province (Nepali) | `"कोशी प्रदेश"` |
| `STATE_ID` | int | Province ID (1–7) | `1` |
| `SCConstID` | int | Constituency internal ID | `1` |
| `ConstName` | int | Constituency number | `1` |
| `TotalVoteReceived` | int | Votes (0 pre-election) | `0` |
| `E_STATUS` | null/string | Election status | `null` |
| `CTZDIST` | string | Citizenship district | |
| `FATHER_NAME` | string | Father's name | |
| `SPOUCE_NAME` | string | Spouse's name | |
| `QUALIFICATION` | string | Education qualification | |
| `NAMEOFINST` | string | Educational institution | |
| `EXPERIENCE` | string | Experience description | |
| `OTHERDETAILS` | string | Personal statement | |
| `ADDRESS` | string | Full address | |
| `DOB` | int | Age (duplicate of AGE_YR) | `38` |
| `R` | int | Unknown flag | `1` |

**Candidate Photo URL Pattern:**
```
https://result.election.gov.np/Images/Candidate/{CandidateID}.jpg
```

**Lookup Files (same domain):**

| URL | Content |
|-----|---------|
| `result.election.gov.np/JSONFiles/Election2082/Local/Lookup/states.json` | 7 provinces with IDs |
| `result.election.gov.np/JSONFiles/Election2082/Local/Lookup/districts.json` | 77 districts with province IDs |
| `result.election.gov.np/JSONFiles/StateName.txt` | Province names (Nepali) |
| `result.election.gov.np/JSONFiles/DistrictName.txt` | District names (Nepali) |

### 2.2 PR Candidate PDF — election.gov.np

```
Final List:       https://election.gov.np/admin/public//storage/HOR%202082/PR/PR_FINAL.pdf
Preliminary List: https://election.gov.np/admin/public//storage/HOR%202082/PR/PreliminaryCandidateListPR.pdf
Removals:         https://election.gov.np/admin/public//storage/HOR%202082/PR/बन्दसूचीबाट%20नाम%20हटाइएको.pdf
```

**PR_FINAL.pdf structure** (137 pages, 3.3 MB):
- 63 political parties, 57 election symbols, 3,135 total candidates
- Date: 2082/10/20 (February 2, 2026)
- Organized by party, each party has a section header
- **Columns**: Serial No., Closed-list rank, Full Name, Gender, Father/Mother's Name, Spouse's Name, Voter ID, Inclusion Group (आदिवासी जनजाति, खस आर्य, मधेशी, दलित, थारू, मुस्लिम), District, Disability status, Assembly representation numbers

### 2.3 election.gov.np REST API

**Base URL**: `https://election.gov.np/admin/public/api/`

| Endpoint | Description |
|----------|-------------|
| `/translations` | UI string translations (EN/NP) |
| `/branch?lang=en` | 97 election offices with contacts |
| `/election-deadline?lang=en` | Election countdown info |
| `/resources/notice/?lang=en&page={n}` | Paginated notices (287 items, 29 pages) |
| `/resources/press-release/?lang=en&page={n}` | Press releases (620 items, 62 pages) |
| `/resources/download/?lang=en&page={n}` | Downloadable documents |
| `/search?keyword={query}&lang=en` | Full-text search |

> **Note:** This API does NOT serve candidate data directly. Candidate data is on the `result.election.gov.np` subdomain.

### 2.4 Historical Reference: 2079 Excel Files

```
https://election.gov.np/admin/public//storage/HoR/Candidate_List/ALL_CANDIDATE_HOR_2079_06_26_19_00.xlsx
https://election.gov.np/admin/public//storage/HoR/Candidate_List/ALL_CANDIDATE_PA_2079_06_26_19_00.xlsx
```

Useful for understanding field structure and as a reference for transliteration patterns.

### 2.5 Storage Directory Map

```
/admin/public/storage/HOR 2082/
├── PR/                    → PR candidate lists (PDFs, images)
│   ├── PR_FINAL.pdf       → Final PR candidate list (137 pages)
│   ├── PreliminaryCandidateListPR.pdf
│   └── बन्दसूचीबाट नाम हटाइएको.pdf
├── HOR/                   → General HOR documents
├── NA/                    → National Assembly documents
├── Notice/                → Official notices
├── PP/                    → Political party documents
└── Press Release/         → Press release PDFs
```

---

## 3. Community Portals

### 3.1 election.ekantipur.com — BEST for biographical data

| Attribute | Value |
|-----------|-------|
| **URL** | `https://election.ekantipur.com/?lng=eng` |
| **Tech** | Vanilla JS + jQuery + Highcharts |
| **Data Format** | JavaScript objects embedded in HTML |
| **Candidates** | 3,406 (3,017 M, 388 F, 1 Other) |
| **Parties** | 67 |
| **Voters** | 18,903,689 |

**URL Patterns:**
- Candidate profile: `/profile/{id}?lng=eng`
- Constituency: `/pradesh-{num}/district-{slug}/constituency-{num}?lng=eng`
- Party: `/party/{id}?lng=eng`
- Search: `/search/{name}?lng=eng`

**Unique data fields beyond official JSON**: Birth date, birthplace, education level, family background (father, mother, siblings, spouse), political history, marital status.

**Scrapeable**: YES — proven by existing Go scraper at [hemanta212/nepal-election-api](https://github.com/hemanta212/nepal-election-api). Data embedded in parseable JS objects. jQuery selectors: `.nominee-name`, `.candidate-party-name`, `.vote-count`, `.candidate-wrappper`.

### 3.2 2082.live — BEST for per-candidate detail

| Attribute | Value |
|-----------|-------|
| **URL** | `https://2082.live/` |
| **Tech** | Next.js (React) SSR |
| **Candidates** | 3,406 |
| **Parties** | 66 |

**URL Patterns:**
- Candidates: `/candidates`
- Individual: `/candidates/cand-{CandidateID}` (e.g., `/candidates/cand-339933`)
- Parties: `/parties`
- Analytics: `/analytics`

**Data fields**: Name (EN/NE), age, gender, education, father's name, spouse name, address, party, constituency, district, province, votes, photo. Most comprehensive per-candidate fields.

### 3.3 chautarihub.com — Good structured data

| Attribute | Value |
|-----------|-------|
| **URL** | `https://chautarihub.com/en/election` |
| **Tech** | Next.js SSR |
| **Candidates** | 3,406 |
| **Parties** | 65 |

**URL Patterns:**
- Candidates: `/en/election/candidates`
- Individual: `/en/election/candidates/{numeric_id}`
- Parties: `/en/election/parties`

**Data fields**: id, name, nameNepali, age, gender, partyName, district, constituencyName, photoUrl, symbol, education. Pre-fetched JSON in SSR payloads.

### 3.4 nepalelection.live — Good constituency-level data

| Attribute | Value |
|-----------|-------|
| **URL** | `https://www.nepalelection.live/en` |
| **Tech** | Next.js + Next Intl |

**URL Patterns:**
- Explore constituency: `/en/explore/{district}/{constituency-id}`

**Data**: Full candidate arrays embedded in RSC payloads per constituency. i18n (EN/NE).

### 3.5 Other Portals (lower data quality)

| Portal | URL | Notes |
|--------|-----|-------|
| knowyourcandidate.nepabrita.com | `/candidates/` | Great structure but profiles mostly empty |
| ghosanapatra.vercel.app | `/candidates` | Focus on manifestos; limited candidate data |
| chunab.org | `/candidates` | Returned 0 candidates; under construction |
| election.hamropatro.com | `/2082/candidates` | All stats showed 0; not yet populated |

---

## 4. Open Source Projects & GitHub Repos

| Project | Language | Target Source | Status |
|---------|----------|---------------|--------|
| [hemanta212/nepal-election-api](https://github.com/hemanta212/nepal-election-api) | Go | election.ekantipur.com | Working (2079, adaptable to 2082) |
| [shalin-devkota/2079-General-Election-API](https://github.com/shalin-devkota/2079-General-Election-API) | Python/Flask | election.ekantipur.com | Working (2079) |
| [adityathebe/electionNepal](https://github.com/adityathebe/electionNepal) | Node.js | election.ekantipur.com | Working |
| [pykancha/Election-Api](https://github.com/pykancha/Election-Api) | Python/Flask | election.ekantipur.com | Working |
| [anjesh/election-voters-scraper](https://github.com/anjesh/election-voters-scraper) | Python | election.gov.np | Voter lists only |
| [okfnepal/election-nepal-data](https://github.com/okfnepal/election-nepal-data) | CSV | Various | 2074 local election |
| [akashadhikari/eon_election_analysis](https://github.com/akashadhikari/eon_election_analysis) | Python/Jupyter | Analysis | 2079 data + 2082 predictions |
| [pushpa-raj-dangi/election_nepal_api](https://github.com/pushpa-raj-dangi/election_nepal_api) | C#/.NET | Unknown | Minimal docs |

---

## 5. Scraping Plan Per Source

### Plan A: FPTP from result.election.gov.np (RECOMMENDED — simplest)

```
Method: Single HTTP GET request
URL:    https://result.election.gov.np/JSONFiles/ElectionResultCentral2082.txt
Format: JSON array, no auth, no pagination, no JS rendering needed
Output: 3,406 candidate records with 24 fields each
Photos: https://result.election.gov.np/Images/Candidate/{CandidateID}.jpg
```

**Steps:**
1. Fetch the JSON file (single request)
2. Parse JSON array
3. For each candidate, download photo by CandidateID
4. Fetch lookup files for province/district English names
5. Store in database

**Challenges:** Text is in Nepali (Devanagari). Need transliteration or bilingual mapping.

### Plan B: PR from PDF (requires PDF parsing)

```
Method: Download PDF + extract tables
URL:    https://election.gov.np/admin/public//storage/HOR%202082/PR/PR_FINAL.pdf
Format: PDF, 137 pages, tabular data in Devanagari
Tools:  pdfplumber, camelot, tabula-py, or PyMuPDF
```

**Steps:**
1. Download PR_FINAL.pdf
2. Use `pdfplumber` or `camelot` to extract tables page by page
3. Parse party headers to group candidates by party
4. Clean extracted text (Devanagari Unicode)
5. Map columns to schema fields
6. Handle multi-line rows and page breaks

**Challenges:**
- Devanagari text requires Unicode-aware extraction
- Table borders may be inconsistent
- Party header rows interrupt table flow
- Some cells may span multiple lines

### Plan C: Enrichment from election.ekantipur.com

```
Method: HTML scraping with BeautifulSoup/Cheerio
URL:    https://election.ekantipur.com/pradesh-{N}/district-{slug}/constituency-{num}?lng=eng
Format: HTML with embedded JS data objects
```

**Steps:**
1. Build URL list: 7 provinces × districts × constituencies = 165 pages
2. For each constituency page, parse candidate cards
3. For each candidate, fetch `/profile/{id}?lng=eng` for biographical data
4. Extract embedded JavaScript objects for structured data
5. Rate limit: 2-second delay between requests

**Selectors (from existing Go scraper):**
```
.col-md-6          → Constituency containers
h3                 → Constituency name/number
.candidate-wrappper → Candidate card wrapper
.nominee-name      → Candidate name
.candidate-party-name → Party affiliation
.vote-count        → Vote tally
```

### Plan D: SSR Data from 2082.live / chautarihub.com

```
Method: Fetch SSR HTML pages, parse Next.js RSC payloads
URLs:   https://2082.live/candidates?page={n}
        https://chautarihub.com/en/election/candidates
Format: JSON embedded in React Server Component streaming payloads
```

**Steps:**
1. Fetch candidate listing pages with pagination (24/48/96 per page)
2. Parse the `__NEXT_DATA__` or RSC payload from HTML
3. Extract candidate JSON objects
4. For individual profiles, fetch `/candidates/cand-{id}`

---

## 6. Candidate Data Schema

### 6.1 Unified FPTP Candidate Record (JSON)

```json
{
  "id": 339933,
  "name_ne": "क्षितिज थेबे",
  "name_en": "Kshitij Thebe",
  "age": 38,
  "gender": "male",
  "date_of_birth": null,
  "father_name": "...",
  "spouse_name": "...",
  "citizenship_district": "...",
  "address": "...",
  "qualification": "Bachelor's",
  "institution": "...",
  "experience": "...",
  "other_details": "...",
  "party": {
    "name_ne": "नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)",
    "name_en": "CPN (Unified Marxist-Leninist)",
    "symbol_code": 2598,
    "symbol_name_ne": "सुर्य",
    "symbol_name_en": "Sun"
  },
  "constituency": {
    "province_id": 1,
    "province_name_ne": "कोशी प्रदेश",
    "province_name_en": "Koshi Province",
    "district_name_ne": "ताप्लेजुङ",
    "district_name_en": "Taplejung",
    "constituency_number": 1
  },
  "election": {
    "type": "FPTP",
    "votes_received": 0,
    "status": null
  },
  "photo_url": "https://result.election.gov.np/Images/Candidate/339933.jpg",
  "sources": ["result.election.gov.np", "election.ekantipur.com"]
}
```

### 6.2 PR Candidate Record (from PDF extraction)

```json
{
  "serial_no": 1,
  "closed_list_rank": 1,
  "name_ne": "...",
  "gender": "...",
  "father_mother_name": "...",
  "spouse_name": "...",
  "voter_id": "...",
  "inclusion_group": "आदिवासी जनजाति",
  "citizenship_district": "...",
  "disability_status": false,
  "party": {
    "name_ne": "...",
    "name_en": "..."
  },
  "election": {
    "type": "PR"
  }
}
```

---

## 7. PR Candidate PDF Extraction

### Strategy

The PR_FINAL.pdf (137 pages, 3,135 candidates from 63 parties) requires table extraction.

**Recommended tools (Python):**

| Tool | Best For | Notes |
|------|----------|-------|
| `pdfplumber` | Text-based PDFs with clear table lines | Best first choice |
| `camelot` | PDFs with visible table borders | Good accuracy on structured tables |
| `tabula-py` | Java-based extraction | Requires Java runtime |
| `PyMuPDF (fitz)` | Low-level text extraction | Fallback for complex layouts |

**Extraction approach:**
1. Open PDF with `pdfplumber`
2. Iterate pages, detect tables via `page.extract_tables()`
3. Identify party header rows (they span the full table width)
4. Parse data rows into candidate records
5. Clean Unicode text, strip whitespace
6. Validate: count should sum to ~3,135

### Known challenges:
- Party headers interrupt table structure → need regex detection
- Some candidate names may span two lines
- Inclusion group column has checkbox-style marks
- Page headers/footers need filtering
- Devanagari numerals (१, २, ३...) may need conversion to Arabic (1, 2, 3...)

---

## 8. Challenges & Recommendations

### 8.1 Data Quality Issues

| Issue | Description | Mitigation |
|-------|-------------|------------|
| **Nepali-only text** | Official JSON has Devanagari text only | Use ekantipur for English names, or build transliteration mapping |
| **No FPTP PDF** | Unlike PR, no single PDF for FPTP candidates | Use JSON from result.election.gov.np instead |
| **DOB vs Age** | `DOB` field contains age, not date of birth | Use ekantipur profiles for actual birth dates |
| **Inconsistent party names** | Slight variations across sources | Normalize using SYMBOLCODE as canonical party ID |
| **Missing English names** | Official source has Nepali only | Cross-reference with ekantipur or 2082.live for English |
| **PR data in PDF only** | No structured JSON for PR candidates | Must use PDF extraction |
| **Photo availability** | Some CandidateIDs may not have photos | Handle 404s gracefully |
| **Devanagari numerals** | Some PDFs use Nepali numerals | Convert: ०→0, १→1, ..., ९→9 |

### 8.2 Technical Challenges

| Challenge | Solution |
|-----------|----------|
| election.gov.np is a React SPA | Use the JSON endpoint at result.election.gov.np instead |
| Next.js SSR sites (2082.live, chautarihub) | Parse `__NEXT_DATA__` JSON or RSC payloads |
| Rate limiting | Add 1-2 second delays between requests; use official JSON first |
| Encoding | Ensure UTF-8 throughout the pipeline |
| No official API docs | Reverse-engineered endpoints documented above |
| PDF table extraction accuracy | Use pdfplumber + manual validation on sample pages |

### 8.3 Recommendations

1. **Start with the official JSON** (`ElectionResultCentral2082.txt`) — it's a single GET request for all 3,406 FPTP candidates with no auth, no pagination, no scraping needed.
2. **Extract PR data from PDF** using `pdfplumber` — this is the only structured source for PR candidates.
3. **Enrich with English names** from election.ekantipur.com or 2082.live by matching on CandidateID.
4. **Download photos** from `result.election.gov.np/Images/Candidate/{ID}.jpg`.
5. **Build a bilingual mapping** of party names, district names, and province names using the lookup files.
6. **Cache everything locally** — don't depend on live scraping for the website.
7. **Set up periodic re-fetch** of the JSON file post-election for live vote counts.

---

## 9. Sample Scraping Code

### 9.1 FPTP: Fetch Official JSON (Python)

```python
"""
Fetch all 3,406 FPTP candidates from the official Election Commission JSON.
This is the primary and simplest data source — a single HTTP request.
"""
import json
import requests
import os
import time

# --- 1. Fetch all FPTP candidates ---
CANDIDATES_URL = "https://result.election.gov.np/JSONFiles/ElectionResultCentral2082.txt"
STATES_URL = "https://result.election.gov.np/JSONFiles/Election2082/Local/Lookup/states.json"
DISTRICTS_URL = "https://result.election.gov.np/JSONFiles/Election2082/Local/Lookup/districts.json"
PHOTO_BASE = "https://result.election.gov.np/Images/Candidate"

def fetch_candidates():
    """Fetch the complete FPTP candidate dataset."""
    resp = requests.get(CANDIDATES_URL, timeout=30)
    resp.raise_for_status()
    candidates = resp.json()
    print(f"Fetched {len(candidates)} FPTP candidates")
    return candidates

def fetch_lookups():
    """Fetch province and district lookup tables."""
    states = requests.get(STATES_URL, timeout=10).json()
    districts = requests.get(DISTRICTS_URL, timeout=10).json()
    return states, districts

def download_photo(candidate_id, output_dir="photos"):
    """Download a candidate's photo by ID."""
    os.makedirs(output_dir, exist_ok=True)
    url = f"{PHOTO_BASE}/{candidate_id}.jpg"
    resp = requests.get(url, timeout=10)
    if resp.status_code == 200:
        path = os.path.join(output_dir, f"{candidate_id}.jpg")
        with open(path, "wb") as f:
            f.write(resp.content)
        return path
    return None

def normalize_candidate(raw):
    """Transform raw JSON record into normalized schema."""
    return {
        "id": raw["CandidateID"],
        "name_ne": raw["CandidateName"].strip(),
        "age": raw["AGE_YR"],
        "gender": "male" if raw["Gender"].strip() == "पुरुष" else
                  "female" if raw["Gender"].strip() == "महिला" else "other",
        "father_name": raw.get("FATHER_NAME", "").strip(),
        "spouse_name": raw.get("SPOUCE_NAME", "").strip(),
        "address": raw.get("ADDRESS", "").strip(),
        "qualification": raw.get("QUALIFICATION", "").strip(),
        "institution": raw.get("NAMEOFINST", "").strip(),
        "experience": raw.get("EXPERIENCE", "").strip(),
        "other_details": raw.get("OTHERDETAILS", "").strip(),
        "citizenship_district": raw.get("CTZDIST", "").strip(),
        "party": {
            "name_ne": raw["PoliticalPartyName"].strip(),
            "symbol_code": raw["SYMBOLCODE"],
            "symbol_name_ne": raw["SymbolName"].strip(),
        },
        "constituency": {
            "province_id": raw["STATE_ID"],
            "province_name_ne": raw["StateName"].strip(),
            "district_name_ne": raw["DistrictName"].strip(),
            "number": raw["ConstName"],
        },
        "votes": raw["TotalVoteReceived"],
        "status": raw["E_STATUS"],
        "photo_url": f"{PHOTO_BASE}/{raw['CandidateID']}.jpg",
        "election_type": "FPTP",
    }

if __name__ == "__main__":
    candidates = fetch_candidates()
    states, districts = fetch_lookups()

    normalized = [normalize_candidate(c) for c in candidates]

    with open("fptp_candidates.json", "w", encoding="utf-8") as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(normalized)} candidates to fptp_candidates.json")

    # Download photos (rate-limited)
    for c in normalized[:5]:  # Demo: first 5
        path = download_photo(c["id"])
        print(f"  Photo: {c['name_ne']} → {path}")
        time.sleep(0.5)
```

### 9.2 PR: Extract from PDF (Python)

```python
"""
Extract PR (Proportional Representation) candidate data from the
official Election Commission PDF (PR_FINAL.pdf, 137 pages).
"""
import pdfplumber
import requests
import json
import re
import os

PR_PDF_URL = "https://election.gov.np/admin/public//storage/HOR%202082/PR/PR_FINAL.pdf"
PDF_PATH = "PR_FINAL.pdf"

# Nepali to Arabic numeral conversion
NEPALI_DIGITS = str.maketrans("०१२३४५६७८९", "0123456789")

def download_pdf():
    """Download the PR candidate list PDF."""
    if not os.path.exists(PDF_PATH):
        print("Downloading PR_FINAL.pdf...")
        resp = requests.get(PR_PDF_URL, timeout=60)
        resp.raise_for_status()
        with open(PDF_PATH, "wb") as f:
            f.write(resp.content)
        print(f"Downloaded {len(resp.content)} bytes")

def convert_nepali_numerals(text):
    """Convert Nepali digits to Arabic digits."""
    if text:
        return text.translate(NEPALI_DIGITS)
    return text

def extract_pr_candidates():
    """Extract all PR candidates from the PDF."""
    download_pdf()
    candidates = []
    current_party = None

    with pdfplumber.open(PDF_PATH) as pdf:
        for page_num, page in enumerate(pdf.pages):
            text = page.extract_text() or ""

            # Detect party headers (lines that look like party names)
            # Party sections typically have the party name in a header row
            lines = text.split("\n")
            for line in lines:
                line = line.strip()
                # Skip empty lines and page headers
                if not line or line.startswith("निर्वाचन") or line.startswith("क्रम"):
                    continue

                # Detect party header (heuristic: lines ending with common
                # party suffixes or containing "पार्टी", "कांग्रेस", etc.)
                if ("पार्टी" in line or "कांग्रेस" in line or
                    "मोर्चा" in line or "दल" in line) and len(line.split()) < 15:
                    current_party = line
                    continue

            # Extract tables from the page
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if not row or len(row) < 5:
                        continue
                    # Skip header rows
                    if row[0] and ("क्रम" in str(row[0]) or "बन्दसूची" in str(row[0])):
                        continue

                    serial = convert_nepali_numerals(str(row[0]).strip()) if row[0] else ""
                    if not serial or not serial.isdigit():
                        continue

                    candidate = {
                        "serial_no": int(serial),
                        "closed_list_rank": convert_nepali_numerals(
                            str(row[1]).strip()) if len(row) > 1 and row[1] else None,
                        "name_ne": str(row[2]).strip() if len(row) > 2 and row[2] else "",
                        "gender": str(row[3]).strip() if len(row) > 3 and row[3] else "",
                        "father_mother_name": str(row[4]).strip() if len(row) > 4 and row[4] else "",
                        "spouse_name": str(row[5]).strip() if len(row) > 5 and row[5] else "",
                        "voter_id": convert_nepali_numerals(
                            str(row[6]).strip()) if len(row) > 6 and row[6] else "",
                        "inclusion_group": str(row[7]).strip() if len(row) > 7 and row[7] else "",
                        "district": str(row[8]).strip() if len(row) > 8 and row[8] else "",
                        "party_name_ne": current_party,
                        "election_type": "PR",
                        "page": page_num + 1,
                    }
                    candidates.append(candidate)

    return candidates

if __name__ == "__main__":
    candidates = extract_pr_candidates()
    print(f"Extracted {len(candidates)} PR candidates")

    with open("pr_candidates.json", "w", encoding="utf-8") as f:
        json.dump(candidates, f, ensure_ascii=False, indent=2)
    print("Saved to pr_candidates.json")

    # Summary by party
    parties = {}
    for c in candidates:
        p = c["party_name_ne"] or "Unknown"
        parties[p] = parties.get(p, 0) + 1
    print(f"\nParties found: {len(parties)}")
    for party, count in sorted(parties.items(), key=lambda x: -x[1])[:10]:
        print(f"  {party}: {count} candidates")
```

### 9.3 Enrichment: Scrape ekantipur for English names (Python)

```python
"""
Scrape election.ekantipur.com for English candidate names and
biographical data to enrich the official Nepali-only dataset.
"""
import requests
from bs4 import BeautifulSoup
import json
import time
import re

BASE_URL = "https://election.ekantipur.com"

# District slugs per province (partial example — build full list)
PROVINCE_DISTRICTS = {
    1: ["taplejung", "panchthar", "ilam", "jhapa", "morang", "sunsari",
        "dhankuta", "terhathum", "sankhuwasabha", "bhojpur", "solukhumbu",
        "okhaldhunga", "khotang", "udayapur"],
    # ... add all 77 districts across 7 provinces
}

def get_constituency_url(province, district, constituency):
    """Build constituency page URL."""
    return (f"{BASE_URL}/pradesh-{province}/district-{district}"
            f"/constituency-{constituency}?lng=eng")

def scrape_constituency(province, district, constituency):
    """Scrape all candidates from one constituency page."""
    url = get_constituency_url(province, district, constituency)
    resp = requests.get(url, timeout=15)
    if resp.status_code != 200:
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    candidates = []

    for card in soup.select(".candidate-wrappper"):
        name_el = card.select_one(".nominee-name")
        party_el = card.select_one(".candidate-party-name")
        votes_el = card.select_one(".vote-count")

        if name_el:
            candidates.append({
                "name_en": name_el.get_text(strip=True),
                "party_en": party_el.get_text(strip=True) if party_el else "",
                "votes": votes_el.get_text(strip=True) if votes_el else "0",
                "province": province,
                "district": district,
                "constituency": constituency,
            })

    return candidates

def scrape_candidate_profile(candidate_id):
    """Scrape detailed biographical data for one candidate."""
    url = f"{BASE_URL}/profile/{candidate_id}?lng=eng"
    resp = requests.get(url, timeout=15)
    if resp.status_code != 200:
        return None

    soup = BeautifulSoup(resp.text, "html.parser")
    # Extract biographical fields from profile page
    profile = {"id": candidate_id}

    # Parse structured data from the profile page
    for row in soup.select(".profile-info-row, .info-row, tr"):
        label = row.select_one(".label, th, td:first-child")
        value = row.select_one(".value, td:last-child")
        if label and value:
            key = label.get_text(strip=True).lower().replace(" ", "_")
            profile[key] = value.get_text(strip=True)

    return profile

if __name__ == "__main__":
    # Example: scrape Kathmandu constituencies
    all_candidates = []
    for const_num in range(1, 11):  # Kathmandu has 10 constituencies
        candidates = scrape_constituency(3, "kathmandu", const_num)
        all_candidates.extend(candidates)
        print(f"Kathmandu-{const_num}: {len(candidates)} candidates")
        time.sleep(2)  # Rate limit

    with open("ekantipur_candidates.json", "w", encoding="utf-8") as f:
        json.dump(all_candidates, f, ensure_ascii=False, indent=2)
    print(f"Total: {len(all_candidates)} candidates saved")
```

### 9.4 JavaScript/Node.js Alternative (Fetch official JSON)

```javascript
/**
 * Fetch all FPTP candidates from the official Election Commission JSON.
 * Node.js version using native fetch (Node 18+).
 */
const fs = require("fs");
const path = require("path");

const CANDIDATES_URL =
  "https://result.election.gov.np/JSONFiles/ElectionResultCentral2082.txt";
const PHOTO_BASE = "https://result.election.gov.np/Images/Candidate";

async function fetchCandidates() {
  const resp = await fetch(CANDIDATES_URL);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const candidates = await resp.json();
  console.log(`Fetched ${candidates.length} FPTP candidates`);
  return candidates;
}

function normalize(raw) {
  return {
    id: raw.CandidateID,
    name_ne: raw.CandidateName?.trim(),
    age: raw.AGE_YR,
    gender:
      raw.Gender?.trim() === "पुरुष"
        ? "male"
        : raw.Gender?.trim() === "महिला"
          ? "female"
          : "other",
    father_name: raw.FATHER_NAME?.trim() || null,
    spouse_name: raw.SPOUCE_NAME?.trim() || null,
    address: raw.ADDRESS?.trim() || null,
    qualification: raw.QUALIFICATION?.trim() || null,
    institution: raw.NAMEOFINST?.trim() || null,
    experience: raw.EXPERIENCE?.trim() || null,
    party: {
      name_ne: raw.PoliticalPartyName?.trim(),
      symbol_code: raw.SYMBOLCODE,
      symbol_name_ne: raw.SymbolName?.trim(),
    },
    constituency: {
      province_id: raw.STATE_ID,
      province_ne: raw.StateName?.trim(),
      district_ne: raw.DistrictName?.trim(),
      number: raw.ConstName,
    },
    votes: raw.TotalVoteReceived,
    status: raw.E_STATUS,
    photo_url: `${PHOTO_BASE}/${raw.CandidateID}.jpg`,
    election_type: "FPTP",
  };
}

async function main() {
  const raw = await fetchCandidates();
  const candidates = raw.map(normalize);

  fs.writeFileSync(
    "fptp_candidates.json",
    JSON.stringify(candidates, null, 2),
    "utf-8"
  );
  console.log(`Saved ${candidates.length} candidates to fptp_candidates.json`);

  // Stats
  const parties = new Set(candidates.map((c) => c.party.name_ne));
  const districts = new Set(candidates.map((c) => c.constituency.district_ne));
  console.log(`Parties: ${parties.size}, Districts: ${districts.size}`);
}

main().catch(console.error);
```

---

## 10. Recommended Architecture

### Data Pipeline

```
┌─────────────────────────────────────────────────────────┐
│                    DATA COLLECTION                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │ FPTP JSON    │    │ PR PDF       │    │ Ekantipur │  │
│  │ (3,406)      │    │ (3,135)      │    │ (English) │  │
│  │ 1 HTTP GET   │    │ pdfplumber   │    │ scraping  │  │
│  └──────┬───────┘    └──────┬───────┘    └─────┬─────┘  │
│         │                   │                  │         │
│         ▼                   ▼                  ▼         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              NORMALIZE & MERGE                      │ │
│  │  • Transliterate Nepali → English                   │ │
│  │  • Match FPTP candidates to Ekantipur profiles      │ │
│  │  • Deduplicate by CandidateID / name+constituency   │ │
│  │  • Validate data completeness                       │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              PHOTO DOWNLOAD                         │ │
│  │  • 3,406 photos from result.election.gov.np         │ │
│  │  • Rate-limited, cached locally                     │ │
│  │  • Resize/optimize for web                          │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                                │
└─────────────────────────┼───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      DATABASE                            │
│  • candidates (id, name_ne, name_en, age, gender, ...)  │
│  • parties (id, name_ne, name_en, symbol)               │
│  • constituencies (id, number, district, province)      │
│  • provinces (id, name_ne, name_en)                     │
│  • districts (id, name_ne, name_en, province_id)        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                     WEBSITE                              │
│  • Browse by: Province → District → Constituency        │
│  • Filter by: Party, Gender, Age, Education             │
│  • Search by: Name (Nepali + English)                   │
│  • View: Candidate profile with photo                   │
│  • Segments: FPTP tab + PR tab                          │
│  • Live: Vote counts (re-fetch JSON on election day)    │
└─────────────────────────────────────────────────────────┘
```

### Technology Recommendations

| Layer | Recommendation |
|-------|---------------|
| **Data fetching** | Python (`requests` + `pdfplumber`) or Node.js |
| **Database** | PostgreSQL or SQLite (for simplicity) |
| **Backend** | Next.js API routes, or Flask/FastAPI |
| **Frontend** | Next.js (React) with Tailwind CSS |
| **Search** | Full-text search with Nepali + English |
| **Hosting** | Vercel (Next.js) or similar |
| **Cron** | Re-fetch JSON hourly on election day for live results |

---

## Key URLs Quick Reference

```
# FPTP Candidates (JSON — PRIMARY SOURCE)
https://result.election.gov.np/JSONFiles/ElectionResultCentral2082.txt

# Candidate Photos
https://result.election.gov.np/Images/Candidate/{CandidateID}.jpg

# Province Lookup
https://result.election.gov.np/JSONFiles/Election2082/Local/Lookup/states.json

# District Lookup
https://result.election.gov.np/JSONFiles/Election2082/Local/Lookup/districts.json

# PR Candidate List (PDF)
https://election.gov.np/admin/public//storage/HOR%202082/PR/PR_FINAL.pdf

# PR Preliminary List (PDF)
https://election.gov.np/admin/public//storage/HOR%202082/PR/PreliminaryCandidateListPR.pdf

# Election Commission API Base
https://election.gov.np/admin/public/api/

# Ekantipur Election Portal
https://election.ekantipur.com/?lng=eng

# Historical 2079 Candidate Excel
https://election.gov.np/admin/public//storage/HoR/Candidate_List/ALL_CANDIDATE_HOR_2079_06_26_19_00.xlsx
```
