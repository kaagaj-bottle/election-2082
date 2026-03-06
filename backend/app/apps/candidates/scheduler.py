import logging
import threading
import time

logger = logging.getLogger(__name__)

FETCH_INTERVAL = 60  # seconds after success
RETRY_DELAY = 3  # seconds between retries on failure
_started = False
_lock = threading.Lock()


def _run_loop() -> None:
    """Background loop: fetch results, sleep, repeat."""
    from app.apps.candidates.result_fetcher import fetch_live_results

    # Small initial delay to let the server finish starting
    time.sleep(10)
    logger.info("Result scheduler: first fetch starting")

    while True:
        try:
            result = fetch_live_results("hor-2082")
            if result.success:
                logger.info("Scheduled fetch OK: %d updated", result.candidates_updated)
                time.sleep(FETCH_INTERVAL)
            else:
                logger.warning("Scheduled fetch failed: %s — retrying in %ds", result.error_message, RETRY_DELAY)
                time.sleep(RETRY_DELAY)
        except Exception:
            logger.exception("Scheduled fetch crashed — retrying in %ds", RETRY_DELAY)
            time.sleep(RETRY_DELAY)


def start_result_scheduler() -> None:
    """Start the background fetch thread (idempotent)."""
    global _started
    with _lock:
        if _started:
            return
        _started = True
    t = threading.Thread(target=_run_loop, daemon=True, name="result-fetcher")
    t.start()
    logger.info("Result scheduler started (every %ds)", FETCH_INTERVAL)
