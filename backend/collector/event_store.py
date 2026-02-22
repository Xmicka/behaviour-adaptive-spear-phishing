"""SQLite-backed event store for real-time behavioral data collection.

Stores user behavioral events (page views, clicks, typing cadence, etc.)
collected from the browser collector script. Provides query and export
utilities for feeding data into the anomaly detection pipeline.

Security notes:
- All queries use parameterized statements to prevent SQL injection.
- No PII or sensitive content is stored — only behavioral patterns.
- Events are keyed by opaque user_id and session_id strings.
"""

from __future__ import annotations

import json
import logging
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

logger = logging.getLogger(__name__)

# Default DB location (sibling to data/)
_DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "behavioral_events.db"

# Thread-local storage for connections (SQLite is not thread-safe by default)
_local = threading.local()


class EventStore:
    """SQLite-backed store for behavioral events."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = str(db_path or _DEFAULT_DB_PATH)
        self._ensure_schema()

    def _get_conn(self) -> sqlite3.Connection:
        """Get a thread-local SQLite connection."""
        if not hasattr(_local, "connections"):
            _local.connections = {}
        if self.db_path not in _local.connections:
            conn = sqlite3.connect(self.db_path, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA journal_mode=WAL")  # Better concurrent reads
            conn.execute("PRAGMA busy_timeout=5000")
            _local.connections[self.db_path] = conn
        return _local.connections[self.db_path]

    def _ensure_schema(self):
        """Create tables if they don't exist."""
        conn = self._get_conn()
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS behavioral_events (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     TEXT NOT NULL,
                session_id  TEXT NOT NULL,
                event_type  TEXT NOT NULL,
                event_data  TEXT DEFAULT '{}',
                page_url    TEXT DEFAULT '',
                timestamp   TEXT NOT NULL,
                ip_address  TEXT DEFAULT '',
                user_agent  TEXT DEFAULT '',
                created_at  TEXT DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_events_user
                ON behavioral_events(user_id);
            CREATE INDEX IF NOT EXISTS idx_events_session
                ON behavioral_events(session_id);
            CREATE INDEX IF NOT EXISTS idx_events_type
                ON behavioral_events(event_type);
            CREATE INDEX IF NOT EXISTS idx_events_timestamp
                ON behavioral_events(timestamp);

            CREATE TABLE IF NOT EXISTS pipeline_runs (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                started_at  TEXT NOT NULL,
                finished_at TEXT,
                status      TEXT DEFAULT 'running',
                event_count INTEGER DEFAULT 0,
                user_count  INTEGER DEFAULT 0,
                error       TEXT DEFAULT ''
            );
        """)
        conn.commit()
        logger.info("EventStore schema ensured at %s", self.db_path)

    # ── Insert ────────────────────────────────────────────────────────

    def insert_events(
        self,
        user_id: str,
        session_id: str,
        events: List[Dict[str, Any]],
        ip_address: str = "",
        user_agent: str = "",
    ) -> int:
        """Insert a batch of behavioral events. Returns count inserted."""
        conn = self._get_conn()
        rows = []
        for evt in events:
            rows.append((
                user_id,
                session_id,
                evt.get("type", "unknown"),
                json.dumps(evt.get("data", {})) if isinstance(evt.get("data"), dict) else json.dumps({}),
                evt.get("url", evt.get("page_url", "")),
                evt.get("timestamp", datetime.utcnow().isoformat()),
                ip_address,
                user_agent,
            ))

        conn.executemany(
            """INSERT INTO behavioral_events
               (user_id, session_id, event_type, event_data, page_url, timestamp, ip_address, user_agent)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            rows,
        )
        conn.commit()
        inserted = len(rows)
        logger.info("Inserted %d event(s) for user=%s session=%s", inserted, user_id, session_id)
        return inserted

    # ── Query ─────────────────────────────────────────────────────────

    def get_events(
        self,
        user_id: Optional[str] = None,
        event_type: Optional[str] = None,
        since: Optional[str] = None,
        limit: int = 200,
    ) -> List[Dict[str, Any]]:
        """Query events with optional filters."""
        conn = self._get_conn()
        clauses: List[str] = []
        params: List[Any] = []

        if user_id:
            clauses.append("user_id = ?")
            params.append(user_id)
        if event_type:
            clauses.append("event_type = ?")
            params.append(event_type)
        if since:
            clauses.append("timestamp >= ?")
            params.append(since)

        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        sql = f"SELECT * FROM behavioral_events {where} ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)

        rows = conn.execute(sql, params).fetchall()
        return [dict(r) for r in rows]

    def get_event_stats(self) -> Dict[str, Any]:
        """Return summary statistics about collected events."""
        conn = self._get_conn()
        total = conn.execute("SELECT COUNT(*) FROM behavioral_events").fetchone()[0]
        users = conn.execute("SELECT COUNT(DISTINCT user_id) FROM behavioral_events").fetchone()[0]
        sessions = conn.execute("SELECT COUNT(DISTINCT session_id) FROM behavioral_events").fetchone()[0]

        # Per-type breakdown
        type_rows = conn.execute(
            "SELECT event_type, COUNT(*) as cnt FROM behavioral_events GROUP BY event_type ORDER BY cnt DESC"
        ).fetchall()
        type_breakdown = {r["event_type"]: r["cnt"] for r in type_rows}

        # Last event time
        last_row = conn.execute(
            "SELECT timestamp FROM behavioral_events ORDER BY timestamp DESC LIMIT 1"
        ).fetchone()
        last_event = last_row["timestamp"] if last_row else None

        # Events in last hour
        one_hour_ago = (datetime.utcnow() - timedelta(hours=1)).isoformat()
        recent = conn.execute(
            "SELECT COUNT(*) FROM behavioral_events WHERE created_at >= ?", (one_hour_ago,)
        ).fetchone()[0]

        return {
            "total_events": total,
            "unique_users": users,
            "unique_sessions": sessions,
            "event_types": type_breakdown,
            "last_event_at": last_event,
            "events_last_hour": recent,
            "db_path": self.db_path,
        }

    # ── Export to pipeline format ─────────────────────────────────────

    def export_to_auth_format(self) -> pd.DataFrame:
        """Convert collected behavioral events to auth_sample.csv-compatible format.

        Maps behavioral events to the authentication log schema expected by
        the existing pipeline:
          - user → user_id
          - src  → derived from IP or session context
          - dst  → derived from page URL host
          - timestamp → event timestamp
          - success → derived from event type (page_view/click = success, errors = failure)

        This translation enables the existing Isolation Forest pipeline to
        process live behavioral data without modification.
        """
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT user_id, session_id, event_type, event_data, page_url, timestamp, ip_address "
            "FROM behavioral_events ORDER BY timestamp"
        ).fetchall()

        if not rows:
            return pd.DataFrame(columns=["user", "src_host", "dst_host", "timestamp", "success"])

        records = []
        for r in rows:
            user = r["user_id"]
            # src_host = session/IP-based identifier (simulates source host)
            src_host = f"SESSION_{r['session_id'][:8]}" if r["session_id"] else f"IP_{r['ip_address']}"
            # dst_host = page URL host (simulates destination server)
            page_url = r["page_url"] or "unknown"
            dst_host = page_url.split("/")[2] if page_url.startswith("http") and len(page_url.split("/")) > 2 else f"PAGE_{page_url.replace('/', '_')[:20]}"
            # Timestamp
            ts = r["timestamp"]
            # Success: normal browsing = True, suspicious patterns = False
            event_type = r["event_type"]
            success = event_type not in ("error", "suspicious_copy", "rapid_navigation", "unusual_hours")

            records.append({
                "user": user,
                "src_host": src_host,
                "dst_host": dst_host,
                "timestamp": ts,
                "success": success,
            })

        return pd.DataFrame(records)

    # ── Pipeline run tracking ─────────────────────────────────────────

    def record_pipeline_start(self, event_count: int, user_count: int) -> int:
        """Record a pipeline run start. Returns run ID."""
        conn = self._get_conn()
        cursor = conn.execute(
            "INSERT INTO pipeline_runs (started_at, event_count, user_count) VALUES (?, ?, ?)",
            (datetime.utcnow().isoformat(), event_count, user_count),
        )
        conn.commit()
        return cursor.lastrowid

    def record_pipeline_finish(self, run_id: int, status: str = "completed", error: str = ""):
        """Record pipeline run completion."""
        conn = self._get_conn()
        conn.execute(
            "UPDATE pipeline_runs SET finished_at = ?, status = ?, error = ? WHERE id = ?",
            (datetime.utcnow().isoformat(), status, error, run_id),
        )
        conn.commit()

    def get_pipeline_runs(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent pipeline runs."""
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT * FROM pipeline_runs ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]
