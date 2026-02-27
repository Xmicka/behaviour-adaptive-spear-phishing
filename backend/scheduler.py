"""Autonomous pipeline scheduler — runs the full pipeline without admin intervention.

Flow per cycle:
  1. Check for new behavioral events since last run
  2. If new events → run Isolation Forest → compute risk scores
  3. For users above threshold → auto-send phishing emails
  4. Update user states via state machine
  5. Sleep for configured interval, repeat

The scheduler runs in a background daemon thread so it does not block the
Flask application. It is started/stopped via API endpoints.
"""

import logging
import threading
import time
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

_scheduler_thread: Optional[threading.Thread] = None
_scheduler_running = False
_scheduler_lock = threading.Lock()
_last_event_count = 0


def _run_pipeline_cycle(app_context_fn):
    """Execute one pipeline cycle inside the Flask app context."""
    global _last_event_count

    try:
        with app_context_fn():
            from backend.collector.event_store import EventStore
            from backend.config import COLLECTOR_DB_PATH, RISK_THRESHOLD_EMAIL
            from backend.training.user_state import UserStateManager
            from pathlib import Path

            DATA_DIR = Path(__file__).resolve().parent / "data"
            FINAL_CSV = DATA_DIR / "final_risk_scores.csv"

            store = EventStore(str(COLLECTOR_DB_PATH))
            stats = store.get_event_stats()
            current_count = stats.get("total_events", 0)

            # Only run if new events have been collected
            if current_count <= _last_event_count:
                logger.debug("Scheduler: no new events (%d total), skipping", current_count)
                return

            logger.info("Scheduler: %d new events detected, running pipeline...",
                        current_count - _last_event_count)
            _last_event_count = current_count

            # Export and run pipeline
            auth_df = store.export_to_auth_format()
            if auth_df.empty:
                logger.info("Scheduler: no events to process")
                return

            event_count = len(auth_df)
            user_count = auth_df["user"].nunique()
            run_id = store.record_pipeline_start(event_count, user_count)

            from backend.features.feature_extractor import extract_user_features
            from backend.models.isolation_forest import run_isolation_forest
            from backend.scoring.risk_score import compute_risk_score

            features = extract_user_features(auth_df)
            if features.empty:
                store.record_pipeline_finish(run_id, "failed", "No features extracted")
                return

            anomalies = run_isolation_forest(features)
            results = compute_risk_score(anomalies)

            if results.index.name is None:
                if "user" in results.columns:
                    out_df = results.reset_index(drop=True)
                else:
                    out_df = results.reset_index()
            else:
                out_df = results.reset_index()

            out_df.to_csv(str(FINAL_CSV), index=False)
            store.record_pipeline_finish(run_id, "completed")

            logger.info("Scheduler: pipeline completed — %d users scored", user_count)

            # Auto-send phishing emails to high-risk users
            if "final_risk_score" in out_df.columns:
                from backend.mailer.email_logger import EmailLogger
                from backend.config import EMAIL_DB_PATH, SMTP_EMAIL, PLATFORM_BASE_URL
                from backend.mailer.email_sender import send_phishing_email, generate_tracking_links, create_tracking_token
                from backend.mailer.email_templates import generate_email_content

                email_logger = EmailLogger(str(EMAIL_DB_PATH))
                state_mgr = UserStateManager(str(COLLECTOR_DB_PATH))

                high_risk = out_df[out_df["final_risk_score"] >= RISK_THRESHOLD_EMAIL]
                for _, row in high_risk.iterrows():
                    user_id = str(row.get("user", "unknown"))
                    risk_score = float(row["final_risk_score"])

                    # Skip if user has pending training
                    if email_logger.has_pending_training(user_id):
                        continue

                    # Skip users already in non-CLEAN/non-COMPLIANT state
                    current_state = state_mgr.get_state(user_id)
                    if current_state not in ("CLEAN", "COMPLIANT"):
                        continue

                    try:
                        tracking_token = create_tracking_token()
                        links = generate_tracking_links(tracking_token)
                        content = generate_email_content(
                            user_id=user_id,
                            risk_score=risk_score,
                            phishing_link=links["phishing_link"],
                            tracking_pixel_url=links["tracking_pixel"],
                        )

                        recipient = f"{user_id}@company.com"
                        import uuid
                        email_id = f"auto_{uuid.uuid4().hex[:12]}"

                        result = send_phishing_email(
                            recipient_email=recipient,
                            subject=content["subject"],
                            body_html=content["body_html"],
                            body_text=content.get("body_text", ""),
                            tracking_token=tracking_token,
                            sender_name=content["sender_name"],
                        )

                        email_logger.log_email_sent(
                            email_id=email_id,
                            tracking_token=tracking_token,
                            user_id=user_id,
                            recipient_email=recipient,
                            subject=content["subject"],
                            scenario=content["scenario"],
                            template_id=content.get("template_id", ""),
                            risk_score=risk_score,
                            sent_via="auto_scheduler",
                        )

                        # Transition state
                        state_mgr.transition(user_id, "email_sent",
                                             f"Auto-sent by scheduler (risk={risk_score:.2f})")

                        logger.info("Scheduler: sent phishing to %s (risk=%.2f)", user_id, risk_score)
                    except Exception as exc:
                        logger.warning("Scheduler: failed to email %s: %s", user_id, exc)

            # Sync risk scores to Firestore
            try:
                from backend.collector.firestore_sync import sync_risk_scores_to_firestore
                if "final_risk_score" in out_df.columns:
                    scores = out_df[["user", "final_risk_score"]].to_dict("records")
                    sync_risk_scores_to_firestore(scores)
            except Exception:
                pass

    except Exception as exc:
        logger.error("Scheduler: pipeline cycle failed: %s", exc, exc_info=True)


def _scheduler_loop(interval_seconds: int, app_context_fn):
    """Main scheduler loop running in background thread."""
    global _scheduler_running
    logger.info("Scheduler started (interval=%ds)", interval_seconds)

    while _scheduler_running:
        _run_pipeline_cycle(app_context_fn)
        # Sleep in small increments so we can stop quickly
        for _ in range(interval_seconds):
            if not _scheduler_running:
                break
            time.sleep(1)

    logger.info("Scheduler stopped")


def start_scheduler(interval_minutes: int, app_context_fn) -> bool:
    """Start the autonomous pipeline scheduler.

    Args:
        interval_minutes: Minutes between pipeline cycles
        app_context_fn: Flask app.app_context callable

    Returns True if started, False if already running.
    """
    global _scheduler_thread, _scheduler_running

    with _scheduler_lock:
        if _scheduler_running:
            return False

        _scheduler_running = True
        _scheduler_thread = threading.Thread(
            target=_scheduler_loop,
            args=(interval_minutes * 60, app_context_fn),
            daemon=True,
            name="pipeline-scheduler",
        )
        _scheduler_thread.start()
        return True


def stop_scheduler() -> bool:
    """Stop the scheduler. Returns True if stopped, False if not running."""
    global _scheduler_running

    with _scheduler_lock:
        if not _scheduler_running:
            return False
        _scheduler_running = False
        return True


def is_scheduler_running() -> bool:
    """Check if the scheduler is currently active."""
    return _scheduler_running


def get_scheduler_status() -> dict:
    """Return scheduler status for the API."""
    return {
        "running": _scheduler_running,
        "last_event_count": _last_event_count,
        "thread_alive": _scheduler_thread.is_alive() if _scheduler_thread else False,
    }
