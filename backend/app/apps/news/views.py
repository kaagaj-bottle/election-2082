from __future__ import annotations

import re
import time
import xml.etree.ElementTree as ET
from datetime import datetime
from email.utils import parsedate_to_datetime
from typing import TypedDict
from urllib.request import Request, urlopen

from rest_framework.decorators import api_view
from rest_framework.request import Request as DRFRequest
from rest_framework.response import Response

# ---------------------------------------------------------------------------
# RSS feed configuration
# ---------------------------------------------------------------------------

_FEEDS: list[dict[str, str]] = [
    {
        "name": "OnlineKhabar",
        "url": "https://www.onlinekhabar.com/content/news/feed",
        "lang": "ne",
    },
    {
        "name": "OnlineKhabar English",
        "url": "https://english.onlinekhabar.com/feed",
        "lang": "en",
    },
    {
        "name": "Setopati",
        "url": "https://www.setopati.com/feed",
        "lang": "ne",
    },
    {
        "name": "Nagarik News",
        "url": "https://nagariknews.nagariknetwork.com/feed",
        "lang": "ne",
    },
    {
        "name": "Kathmandu Post",
        "url": "https://kathmandupost.com/rss",
        "lang": "en",
    },
]

# ---------------------------------------------------------------------------
# Election keyword filter
# ---------------------------------------------------------------------------

_KEYWORDS_NE = [
    "निर्वाचन",
    "चुनाव",
    "मतदान",
    "उम्मेदवार",
    "दल",
    "मत",
    "मतपत्र",
    "मतगणना",
    "प्रतिनिधि",
    "सभा",
    "संसद",
    "राजनीति",
    "राजनीतिक",
    "सरकार",
    "प्रधानमन्त्री",
    "मन्त्री",
    "विपक्ष",
    "गठबन्धन",
]

_KEYWORDS_EN = [
    "election",
    "vote",
    "ballot",
    "candidate",
    "party",
    "poll",
    "constituency",
    "parliament",
    "government",
    "minister",
    "opposition",
    "coalition",
    "political",
]

_NE_PATTERN = re.compile("|".join(re.escape(k) for k in _KEYWORDS_NE))
_EN_PATTERN = re.compile("|".join(re.escape(k) for k in _KEYWORDS_EN), re.IGNORECASE)

_HTML_TAG_RE = re.compile(r"<[^>]+>")

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------


class NewsArticle(TypedDict):
    title: str
    link: str
    source: str
    source_lang: str
    published: str | None
    summary: str
    image_url: str | None


# ---------------------------------------------------------------------------
# In-memory TTL cache (15 minutes)
# ---------------------------------------------------------------------------

_CACHE_TTL = 15 * 60  # seconds
_cache: dict[str, tuple[float, list[NewsArticle]]] = {}

# ---------------------------------------------------------------------------
# Feed fetcher
# ---------------------------------------------------------------------------


def _strip_html(text: str) -> str:
    return _HTML_TAG_RE.sub("", text).strip()


def _parse_date(date_str: str | None) -> datetime | None:
    if not date_str:
        return None
    try:
        return parsedate_to_datetime(date_str)
    except Exception:
        pass
    # Try ISO 8601
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None


def _extract_image(item: ET.Element) -> str | None:
    # Check <enclosure> with image type
    enclosure = item.find("enclosure")
    if enclosure is not None:
        enc_type = enclosure.get("type", "")
        if "image" in enc_type:
            return enclosure.get("url")

    # Check media:content / media:thumbnail
    for ns in [
        "{http://search.yahoo.com/mrss/}",
        "{http://search.yahoo.com/mrss}",
    ]:
        media = item.find(f"{ns}content")
        if media is not None:
            return media.get("url")
        thumb = item.find(f"{ns}thumbnail")
        if thumb is not None:
            return thumb.get("url")

    # Try to find image in description HTML
    desc = item.findtext("description") or ""
    img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', desc)
    if img_match:
        return img_match.group(1)

    return None


def _is_election_related(title: str, summary: str) -> bool:
    text = f"{title} {summary}"
    return bool(_NE_PATTERN.search(text) or _EN_PATTERN.search(text))


def _fetch_feed(feed: dict[str, str]) -> list[NewsArticle]:
    url = feed["url"]

    # Check cache
    cached = _cache.get(url)
    if cached and (time.time() - cached[0]) < _CACHE_TTL:
        return cached[1]

    articles: list[NewsArticle] = []
    try:
        req = Request(url, headers={"User-Agent": _USER_AGENT})
        with urlopen(req, timeout=10) as resp:
            data = resp.read()
        text = data.decode("utf-8", errors="replace")
        # Trim junk after closing root element (some feeds append HTML/scripts)
        for closing_tag in ("</rss>", "</feed>"):
            idx = text.find(closing_tag)
            if idx != -1:
                text = text[: idx + len(closing_tag)]
                break
        root = ET.fromstring(text)

        for item in root.iter("item"):
            title = item.findtext("title") or ""
            link = item.findtext("link") or ""
            pub_date = item.findtext("pubDate")
            description = _strip_html(item.findtext("description") or "")
            image_url = _extract_image(item)

            parsed_date = _parse_date(pub_date)

            articles.append(
                NewsArticle(
                    title=title.strip(),
                    link=link.strip(),
                    source=feed["name"],
                    source_lang=feed["lang"],
                    published=parsed_date.isoformat() if parsed_date else None,
                    summary=description[:300],
                    image_url=image_url,
                )
            )
    except Exception:
        # On failure, return cached data if available (even if stale)
        if cached:
            return cached[1]
        return []

    _cache[url] = (time.time(), articles)
    return articles


# ---------------------------------------------------------------------------
# View
# ---------------------------------------------------------------------------


@api_view(["GET"])
def news_list(request: DRFRequest) -> Response:
    all_articles: list[NewsArticle] = []
    for feed in _FEEDS:
        all_articles.extend(_fetch_feed(feed))

    # Filter for election relevance
    filtered = [a for a in all_articles if _is_election_related(a["title"], a["summary"])]

    # Sort by date descending; treat missing dates as "now" so feeds
    # without pubDate (e.g. Kathmandu Post) are not pushed to the end.
    now = datetime.now().astimezone().isoformat()

    def sort_key(a: NewsArticle) -> str:
        return a["published"] or now

    filtered.sort(key=sort_key, reverse=True)

    return Response(filtered[:50])
