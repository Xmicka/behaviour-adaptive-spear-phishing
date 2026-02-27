"""User training state machine — SQLite-backed lifecycle for each user.

States
------
  CLEAN                      — no phishing sent yet
  PHISH_SENT                 — phishing email delivered, awaiting response
  PHISH_CLICKED              — user clicked the phishing link
  MICRO_TRAINING_REQUIRED    — micro-training page shown, not yet completed
  MICRO_TRAINING_COMPLETED   — micro-training finished
  MANDATORY_TRAINING_REQUIRED — mandatory training link sent, not yet completed
  COMPLIANT                  — all training complete, user is compliant

Transitions
-----------
  CLEAN                      → PHISH_SENT       (trigger: email_sent)
  PHISH_SENT                 → PHISH_CLICKED     (trigger: phish_clicked)
  PHISH_SENT                 → COMPLIANT         (trigger: phish_reported or phish_ignored)
  PHISH_CLICKED              → MICRO_TRAINING_REQUIRED (trigger: auto on click)
  MICRO_TRAINING_REQUIRED    → MICRO_TRAINING_COMPLETED (trigger: micro_completed)
  MICRO_TRAINING_COMPLETED   → MANDATORY_TRAINING_REQUIRED (trigger: auto after micro)
  MANDATORY_TRAINING_REQUIRED → COMPLIANT        (trigger: mandatory_completed)
  COMPLIANT                  → PHISH_SENT        (trigger: email_sent — new cycle)

Every transition is logged with timestamp and reason for full audit trail.
"""

import logging
import sqlite3
import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_local = threading.local()

# ── Valid states ──────────────────────────────────────────────
STATES = [
    "CLEAN",
    "PHISH_SENT",
    "PHISH_CLICKED",
    "MICRO_TRAINING_REQUIRED",
    "MICRO_TRAINING_COMPLETED",
    "MANDATORY_TRAINING_REQUIRED",
    "COMPLIANT",
]

# ── Valid transitions: (current_state, trigger) → new_state ──
TRANSITIONS = {
    ("CLEAN", "email_sent"):                        "PHISH_SENT",
    ("PHISH_SENT", "phish_clicked"):                "PHISH_CLICKED",
    ("PHISH_SENT", "phish_reported"):               "COMPLIANT",
    ("PHISH_SENT", "phish_ignored"):                "COMPLIANT",
    ("PHISH_CLICKED", "micro_training_assigned"):   "MICRO_TRAINING_REQUIRED",
    ("MICRO_TRAINING_REQUIRED", "micro_completed"): "MICRO_TRAINING_COMPLETED",
    ("MICRO_TRAINING_COMPLETED", "mandatory_assigned"): "MANDATORY_TRAINING_REQUIRED",
    ("MANDATORY_TRAINING_REQUIRED", "mandatory_completed"): "COMPLIANT",
    # Allow re-phishing compliant users (new cycle)
    ("COMPLIANT", "email_sent"):                    "PHISH_SENT",
}


class UserStateManager:
    """SQLite-backed user state machine with full audit log."""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self._ensure_schema()

    def _conn(self) -> sqlite3.Connection:
        if not hasattr(_local, "conn") or _local.conn is None:
            _local.conn = sqlite3.connect(self.db_path)
            _local.conn.execute("PRAGMA journal_mode=WAL")
        return _local.conn

    def _ensure_schema(self):
        conn = self._conn()
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS user_states (
                user_id TEXT PRIMARY KEY,
                current_state TEXT NOT NULL DEFAULT 'CLEAN',
                updated_at TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS state_transitions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                from_state TEXT NOT NULL,
                to_state TEXT NOT NULL,
                trigger TEXT NOT NULL,
                reason TEXT DEFAULT '',
                timestamp TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_transitions_user
                ON state_transitions(user_id);
        """)
        conn.commit()

    def get_state(self, user_id: str) -> str:
        """Get current state for a user. Returns 'CLEAN' if not found."""
        row = self._conn().execute(
            "SELECT current_state FROM user_states WHERE user_id = ?",
            (user_id,),
        ).fetchone()
        return row[0] if row else "CLEAN"

    def get_all_states(self) -> List[Dict[str, Any]]:
        """Get all user states for the dashboard."""
        cursor = self._conn().execute(
            "SELECT user_id, current_state, updated_at, created_at FROM user_states ORDER BY updated_at DESC"
        )
        return [
            {
                "user_id": r[0],
                "current_state": r[1],
                "updated_at": r[2],
                "created_at": r[3],
            }
            for r in cursor.fetchall()
        ]

    def get_state_distribution(self) -> Dict[str, int]:
        """Get count of users in each state."""
        dist = {s: 0 for s in STATES}
        cursor = self._conn().execute(
            "SELECT current_state, COUNT(*) FROM user_states GROUP BY current_state"
        )
        for row in cursor.fetchall():
            if row[0] in dist:
                dist[row[0]] = row[1]
        return dist

    def get_history(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get transition history for a user."""
        cursor = self._conn().execute(
            "SELECT from_state, to_state, trigger, reason, timestamp "
            "FROM state_transitions WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?",
            (user_id, limit),
        )
        return [
            {
                "from_state": r[0],
                "to_state": r[1],
                "trigger": r[2],
                "reason": r[3],
                "timestamp": r[4],
            }
            for r in cursor.fetchall()
        ]

    def transition(
        self,
        user_id: str,
        trigger: str,
        reason: str = "",
    ) -> Dict[str, Any]:
        """Apply a state transition.

        Returns dict with from_state, to_state, success, and message.
        Raises ValueError if transition is invalid.
        """
        current = self.get_state(user_id)
        key = (current, trigger)

        if key not in TRANSITIONS:
            # Allow some triggers to be idempotent
            return {
                "user_id": user_id,
                "from_state": current,
                "to_state": current,
                "trigger": trigger,
                "success": False,
                "message": f"No transition from '{current}' with trigger '{trigger}'",
            }

        new_state = TRANSITIONS[key]
        now = datetime.utcnow().isoformat()
        conn = self._conn()

        # Upsert user state
        conn.execute(
            """INSERT INTO user_states (user_id, current_state, updated_at, created_at)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(user_id) DO UPDATE SET current_state = ?, updated_at = ?""",
            (user_id, new_state, now, now, new_state, now),
        )

        # Log transition
        conn.execute(
            """INSERT INTO state_transitions
               (user_id, from_state, to_state, trigger, reason, timestamp)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, current, new_state, trigger, reason, now),
        )
        conn.commit()

        logger.info(
            "State transition: %s [%s] → [%s] (trigger=%s, reason=%s)",
            user_id, current, new_state, trigger, reason,
        )

        # Sync to Firestore (fire-and-forget)
        self._sync_to_firestore(user_id, new_state, now)

        result = {
            "user_id": user_id,
            "from_state": current,
            "to_state": new_state,
            "trigger": trigger,
            "reason": reason,
            "success": True,
            "message": f"Transitioned from '{current}' to '{new_state}'",
        }

        # Auto-chain: PHISH_CLICKED → MICRO_TRAINING_REQUIRED
        if new_state == "PHISH_CLICKED":
            self.transition(user_id, "micro_training_assigned", "Auto-assigned on phish click")

        # Auto-chain: MICRO_TRAINING_COMPLETED → MANDATORY_TRAINING_REQUIRED
        if new_state == "MICRO_TRAINING_COMPLETED":
            self.transition(user_id, "mandatory_assigned", "Auto-assigned after micro-training")

        return result

    def _sync_to_firestore(self, user_id: str, state: str, timestamp: str):
        """Best-effort Firestore sync."""
        try:
            from backend.collector.firestore_sync import _get_firestore
            db = _get_firestore()
            if db is None:
                return
            from firebase_admin import firestore as fs
            db.collection("user_states").document(user_id).set({
                "user_id": user_id,
                "current_state": state,
                "updated_at": timestamp,
            }, merge=True)
        except Exception:
            pass  # Non-fatal
