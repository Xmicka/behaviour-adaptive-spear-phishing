"""Optional Firestore sync for extension-collected behavioral events.

When enabled, writes event summaries to the Firestore `events` collection
so the dashboard and pipeline have real-time visibility into extension data.

Requires:
  - firebase-admin package installed
  - GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account JSON

If firebase-admin is not installed or Firestore is unreachable, all sync
calls silently no-op so the core pipeline is unaffected.
"""
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ── Lazy Firestore client initialization ──────────────────────────
_firestore_client = None
_init_attempted = False


def _get_firestore():
    """Lazily initialize the Firestore client. Returns None if unavailable."""
    global _firestore_client, _init_attempted
    if _init_attempted:
        return _firestore_client
    _init_attempted = True

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        # Check if already initialized
        try:
            firebase_admin.get_app()
        except ValueError:
            # Initialize with credentials or default
            cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                # Try Application Default Credentials (works on GCP)
                firebase_admin.initialize_app()

        _firestore_client = firestore.client()
        logger.info("Firestore sync initialized successfully")
    except ImportError:
        logger.info("firebase-admin not installed — Firestore sync disabled")
    except Exception as exc:
        logger.warning("Firestore init failed (sync disabled): %s", exc)

    return _firestore_client


def sync_events_to_firestore(
    user_id: str,
    session_id: str,
    events: List[Dict[str, Any]],
) -> bool:
    """Write an event batch summary to Firestore `events` collection.

    Each document contains:
      - user_id, session_id
      - event_count, event_types (list of unique types)
      - first_event_at, last_event_at
      - source: 'chrome_extension'
      - synced_at (server timestamp)

    Returns True if sync succeeded, False otherwise (never raises).
    """
    db = _get_firestore()
    if db is None:
        return False

    try:
        from firebase_admin import firestore as fs

        # Aggregate event summary
        event_types = list(set(e.get("type", "unknown") for e in events))
        timestamps = [e.get("timestamp", "") for e in events if e.get("timestamp")]
        timestamps.sort()

        doc_data = {
            "user_id": user_id,
            "session_id": session_id,
            "event_count": len(events),
            "event_types": event_types,
            "first_event_at": timestamps[0] if timestamps else "",
            "last_event_at": timestamps[-1] if timestamps else "",
            "source": "chrome_extension",
            "synced_at": fs.SERVER_TIMESTAMP,
        }

        # Use auto-generated document ID
        db.collection("events").add(doc_data)
        logger.debug("Synced %d events to Firestore for user %s", len(events), user_id)
        return True

    except Exception as exc:
        logger.warning("Firestore sync failed (non-fatal): %s", exc)
        return False


def sync_risk_scores_to_firestore(
    scores: List[Dict[str, Any]],
) -> bool:
    """Update employee risk scores in Firestore `employees` collection.

    Matches employees by user_id and updates their riskScore field.
    Returns True if sync succeeded.
    """
    db = _get_firestore()
    if db is None:
        return False

    try:
        from firebase_admin import firestore as fs

        batch = db.batch()
        for score_data in scores:
            user_id = score_data.get("user", "")
            risk_score = score_data.get("final_risk_score", 0)

            # Update by user_id — find or create employee doc
            doc_ref = db.collection("employees").document(user_id)
            batch.set(doc_ref, {
                "riskScore": risk_score,
                "lastScoredAt": fs.SERVER_TIMESTAMP,
            }, merge=True)

        batch.commit()
        logger.info("Synced %d risk scores to Firestore", len(scores))
        return True

    except Exception as exc:
        logger.warning("Firestore risk score sync failed: %s", exc)
        return False
