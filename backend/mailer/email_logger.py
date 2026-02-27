"""Email event logger — SQLite-backed persistence for email + training events.

Tables managed:
  email_events        — one row per sent email
  email_interactions  — opens, clicks, reports
  training_sessions   — micro/mandatory training lifecycle
"""

from __future__ import annotations

import json
import logging
import sqlite3
import threading
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_local = threading.local()


class EmailLogger:
    """SQLite-backed logger for email and training events."""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self._ensure_schema()

    # ── connection ────────────────────────────────────────────────────

    def _conn(self) -> sqlite3.Connection:
        if not hasattr(_local, "email_conns"):
            _local.email_conns = {}
        if self.db_path not in _local.email_conns:
            conn = sqlite3.connect(self.db_path, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA busy_timeout=5000")
            _local.email_conns[self.db_path] = conn
        return _local.email_conns[self.db_path]

    def _ensure_schema(self):
        self._conn().executescript("""
            CREATE TABLE IF NOT EXISTS email_events (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                email_id        TEXT UNIQUE NOT NULL,
                tracking_token  TEXT UNIQUE NOT NULL,
                user_id         TEXT NOT NULL,
                recipient_email TEXT NOT NULL DEFAULT '',
                subject         TEXT NOT NULL DEFAULT '',
                scenario        TEXT NOT NULL DEFAULT '',
                template_id     TEXT NOT NULL DEFAULT '',
                risk_score      REAL NOT NULL DEFAULT 0,
                sent_via        TEXT NOT NULL DEFAULT 'log_only',
                sent_at         TEXT NOT NULL,
                status          TEXT NOT NULL DEFAULT 'sent',
                created_at      TEXT DEFAULT (datetime('now'))
            );
            CREATE INDEX IF NOT EXISTS idx_email_user ON email_events(user_id);
            CREATE INDEX IF NOT EXISTS idx_email_token ON email_events(tracking_token);

            CREATE TABLE IF NOT EXISTS email_interactions (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                email_id        TEXT NOT NULL,
                tracking_token  TEXT NOT NULL,
                user_id         TEXT NOT NULL,
                interaction     TEXT NOT NULL,
                ip_address      TEXT DEFAULT '',
                user_agent      TEXT DEFAULT '',
                timestamp       TEXT NOT NULL,
                FOREIGN KEY (email_id) REFERENCES email_events(email_id)
            );
            CREATE INDEX IF NOT EXISTS idx_interact_email ON email_interactions(email_id);
            CREATE INDEX IF NOT EXISTS idx_interact_token ON email_interactions(tracking_token);

            CREATE TABLE IF NOT EXISTS training_sessions (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id      TEXT UNIQUE NOT NULL,
                user_id         TEXT NOT NULL,
                trigger_email_id TEXT DEFAULT '',
                training_type   TEXT NOT NULL DEFAULT 'micro',
                status          TEXT NOT NULL DEFAULT 'assigned',
                assigned_at     TEXT NOT NULL,
                started_at      TEXT,
                completed_at    TEXT,
                score           REAL DEFAULT 0,
                created_at      TEXT DEFAULT (datetime('now'))
            );
            CREATE INDEX IF NOT EXISTS idx_training_user ON training_sessions(user_id);
        """)
        self._conn().commit()
        logger.info("EmailLogger schema ensured at %s", self.db_path)

    # ── Email events ──────────────────────────────────────────────────

    def log_email_sent(
        self,
        email_id: str,
        tracking_token: str,
        user_id: str,
        recipient_email: str,
        subject: str,
        scenario: str,
        template_id: str,
        risk_score: float,
        sent_via: str,
    ) -> None:
        """Log a sent email event."""
        self._conn().execute(
            """INSERT INTO email_events
               (email_id, tracking_token, user_id, recipient_email, subject,
                scenario, template_id, risk_score, sent_via, sent_at)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (email_id, tracking_token, user_id, recipient_email, subject,
             scenario, template_id, risk_score, sent_via,
             datetime.utcnow().isoformat()),
        )
        self._conn().commit()

    def log_interaction(
        self,
        tracking_token: str,
        interaction: str,
        ip_address: str = "",
        user_agent: str = "",
    ) -> Optional[Dict[str, Any]]:
        """Log an email interaction (open/click/report).

        Returns the email event row if found, else None.
        """
        row = self._conn().execute(
            "SELECT email_id, user_id FROM email_events WHERE tracking_token = ?",
            (tracking_token,),
        ).fetchone()
        if not row:
            logger.warning("Unknown tracking token: %s", tracking_token)
            return None

        self._conn().execute(
            """INSERT INTO email_interactions
               (email_id, tracking_token, user_id, interaction,
                ip_address, user_agent, timestamp)
               VALUES (?,?,?,?,?,?,?)""",
            (row["email_id"], tracking_token, row["user_id"], interaction,
             ip_address, user_agent, datetime.utcnow().isoformat()),
        )

        # Update email status
        new_status = "clicked" if interaction == "click" else (
            "opened" if interaction == "open" else (
                "reported" if interaction == "report" else "interacted"
            )
        )
        self._conn().execute(
            "UPDATE email_events SET status = ? WHERE tracking_token = ? AND status != 'clicked'",
            (new_status, tracking_token),
        )
        self._conn().commit()

        return {"email_id": row["email_id"], "user_id": row["user_id"]}

    def get_email_log(
        self,
        user_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get email event log, optionally filtered by user."""
        if user_id:
            rows = self._conn().execute(
                "SELECT * FROM email_events WHERE user_id = ? ORDER BY sent_at DESC LIMIT ?",
                (user_id, limit),
            ).fetchall()
        else:
            rows = self._conn().execute(
                "SELECT * FROM email_events ORDER BY sent_at DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]

    def get_email_by_token(self, tracking_token: str) -> Optional[Dict[str, Any]]:
        """Retrieve email event by tracking token."""
        row = self._conn().execute(
            "SELECT * FROM email_events WHERE tracking_token = ?",
            (tracking_token,),
        ).fetchone()
        return dict(row) if row else None

    def get_interactions(
        self,
        email_id: Optional[str] = None,
        user_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get email interactions."""
        clauses, params = [], []
        if email_id:
            clauses.append("email_id = ?")
            params.append(email_id)
        if user_id:
            clauses.append("user_id = ?")
            params.append(user_id)
        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        params.append(limit)
        rows = self._conn().execute(
            f"SELECT * FROM email_interactions {where} ORDER BY timestamp DESC LIMIT ?",
            params,
        ).fetchall()
        return [dict(r) for r in rows]

    def get_email_stats(self) -> Dict[str, Any]:
        """Aggregate email statistics."""
        conn = self._conn()
        total = conn.execute("SELECT COUNT(*) FROM email_events").fetchone()[0]
        clicked = conn.execute(
            "SELECT COUNT(*) FROM email_events WHERE status = 'clicked'"
        ).fetchone()[0]
        opened = conn.execute(
            "SELECT COUNT(*) FROM email_events WHERE status IN ('opened','clicked')"
        ).fetchone()[0]
        reported = conn.execute(
            "SELECT COUNT(*) FROM email_events WHERE status = 'reported'"
        ).fetchone()[0]
        return {
            "total_sent": total,
            "total_opened": opened,
            "total_clicked": clicked,
            "total_reported": reported,
            "click_rate": round(clicked / total, 4) if total else 0,
            "open_rate": round(opened / total, 4) if total else 0,
        }

    # ── Training sessions ─────────────────────────────────────────────

    def create_training_session(
        self,
        user_id: str,
        training_type: str = "micro",
        trigger_email_id: str = "",
    ) -> str:
        """Create a new training session. Returns session_id."""
        session_id = f"train_{uuid.uuid4().hex[:12]}"
        self._conn().execute(
            """INSERT INTO training_sessions
               (session_id, user_id, trigger_email_id, training_type, status, assigned_at)
               VALUES (?,?,?,?,?,?)""",
            (session_id, user_id, trigger_email_id, training_type,
             "assigned", datetime.utcnow().isoformat()),
        )
        self._conn().commit()
        return session_id

    def start_training(self, session_id: str) -> bool:
        """Mark training session as started."""
        c = self._conn().execute(
            "UPDATE training_sessions SET status = 'in_progress', started_at = ? WHERE session_id = ?",
            (datetime.utcnow().isoformat(), session_id),
        )
        self._conn().commit()
        return c.rowcount > 0

    def complete_training(self, session_id: str, score: float = 100.0) -> bool:
        """Mark training session as completed."""
        c = self._conn().execute(
            "UPDATE training_sessions SET status = 'completed', completed_at = ?, score = ? WHERE session_id = ?",
            (datetime.utcnow().isoformat(), score, session_id),
        )
        self._conn().commit()
        return c.rowcount > 0

    def complete_training_for_user(self, user_id: str, score: float = 100.0) -> int:
        """Complete all pending training sessions for a user."""
        now = datetime.utcnow().isoformat()
        c = self._conn().execute(
            "UPDATE training_sessions SET status = 'completed', completed_at = ?, score = ? "
            "WHERE user_id = ? AND status IN ('assigned','in_progress')",
            (now, score, user_id),
        )
        self._conn().commit()
        return c.rowcount

    def get_training_sessions(
        self,
        user_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get training sessions with optional filters."""
        clauses, params = [], []
        if user_id:
            clauses.append("user_id = ?")
            params.append(user_id)
        if status:
            clauses.append("status = ?")
            params.append(status)
        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        params.append(limit)
        rows = self._conn().execute(
            f"SELECT * FROM training_sessions {where} ORDER BY assigned_at DESC LIMIT ?",
            params,
        ).fetchall()
        return [dict(r) for r in rows]

    def has_pending_training(self, user_id: str) -> bool:
        """Check if user has incomplete training (blocks further phishing)."""
        row = self._conn().execute(
            "SELECT COUNT(*) FROM training_sessions WHERE user_id = ? AND status IN ('assigned','in_progress')",
            (user_id,),
        ).fetchone()
        return row[0] > 0 if row else False

    def get_training_stats(self) -> Dict[str, Any]:
        """Aggregate training stats."""
        conn = self._conn()
        total = conn.execute("SELECT COUNT(*) FROM training_sessions").fetchone()[0]
        completed = conn.execute(
            "SELECT COUNT(*) FROM training_sessions WHERE status = 'completed'"
        ).fetchone()[0]
        pending = conn.execute(
            "SELECT COUNT(*) FROM training_sessions WHERE status IN ('assigned','in_progress')"
        ).fetchone()[0]
        return {
            "total_sessions": total,
            "completed": completed,
            "pending": pending,
            "completion_rate": round(completed / total, 4) if total else 0,
        }
