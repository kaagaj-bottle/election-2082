import logging
import threading
import time

logger = logging.getLogger(__name__)

FETCH_INTERVAL = 60  # seconds after success
RETRY_DELAY = 3  # seconds between retries on failure
_started = False
_lock = threading.Lock()


def _run_loop() -> None:
    """Background loop: fetch FPTP and PR results, sleep, repeat."""
    from app.apps.candidates.pr_result_fetcher import fetch_pr_results
    from app.apps.candidates.result_fetcher import fetch_live_results

    # Small initial delay to let the server finish starting
    time.sleep(10)
    logger.info("Result scheduler: first fetch starting")

    while True:
        try:
            result = fetch_live_results("hor-2082")
            if result.success:
                logger.info("Scheduled FPTP fetch OK: %d updated", result.candidates_updated)
            else:
                logger.warning("Scheduled FPTP fetch failed: %s", result.error_message)
        except Exception:
            logger.exception("Scheduled FPTP fetch crashed")

        try:
            pr_result = fetch_pr_results()
            if pr_result.success:
                logger.info("Scheduled PR fetch OK: %d parties updated", pr_result.parties_updated)
            else:
                logger.warning("Scheduled PR fetch failed: %s", pr_result.error_message)
        except Exception:
            logger.exception("Scheduled PR fetch crashed")

        # Sleep based on whether both succeeded
        if result.success and pr_result.success:  # type: ignore[possibly-undefined]
            time.sleep(FETCH_INTERVAL)
        else:
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
