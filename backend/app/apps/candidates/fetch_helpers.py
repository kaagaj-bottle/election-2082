"""Shared helpers for election result fetchers."""

import logging
import re
from dataclasses import dataclass

from curl_cffi.requests import Session

logger = logging.getLogger(__name__)

BASE_URL = "https://result.election.gov.np"

_SESSION_PAGES = [
    "/",
    "/MapElectionResult2082.aspx",
]


@dataclass
class FetchResult:
    success: bool
    records_fetched: int = 0
    candidates_updated: int = 0
    parties_updated: int = 0
    error_message: str = ""
    duration_seconds: float = 0


def build_session() -> Session:  # type: ignore[type-arg]
    """Create a curl_cffi session with Chrome TLS impersonation."""
    return Session(impersonate="chrome")


def establish_session(session: Session) -> str | None:  # type: ignore[type-arg]
    """Try session pages to establish cookies and extract CSRF token."""
    html = ""
    for page in _SESSION_PAGES:
        url = BASE_URL + page
        try:
            resp = session.get(url, timeout=30)
            if resp.status_code == 200:
                html = resp.text
                logger.debug("Session established via %s", page)
                break
            logger.warning("Session page %s failed: HTTP %d", page, resp.status_code)
        except Exception:
            logger.warning("Session page %s failed", page, exc_info=True)

    if not html:
        logger.warning("All session pages failed — proceeding without session")
        return None

    val = session.cookies.get("CsrfToken")
    if val:
        logger.debug("Found CSRF token in CsrfToken cookie")
        return val

    patterns = [
        r'<meta\s+name=["\']csrf-token["\']\s+content=["\']([^"\']+)["\']',
        r'<input[^>]+name=["\']__RequestVerificationToken["\'][^>]+value=["\']([^"\']+)["\']',
        r"getCsrfToken\(\)\s*\{[^}]*return\s+['\"]([^'\"]+)['\"]",
        r'var\s+csrfToken\s*=\s*["\']([^"\']+)["\']',
    ]
    for pattern in patterns:
        match = re.search(pattern, html, re.IGNORECASE)
        if match:
            logger.debug("Found CSRF token via pattern: %s", pattern[:40])
            return match.group(1)

    try:
        resp = session.get(BASE_URL + "/JSLibrary/Common.js", timeout=30)
        js_text = resp.text
        for pattern in patterns:
            match = re.search(pattern, js_text, re.IGNORECASE)
            if match:
                logger.debug("Found CSRF token in Common.js")
                return match.group(1)
    except Exception:
        logger.warning("Could not fetch Common.js", exc_info=True)

    logger.debug("No CSRF token found — proceeding without one")
    return None
