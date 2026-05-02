"""SMTP email sending module for spear phishing simulation.

Sends real emails via SMTP (Gmail by default) or falls back to Resend HTTP API
if SMTP fails (e.g. Render blocks port 587). Falls back to log-only mode
when no credentials are provided.

Environment variables:
  SMTP_EMAIL     — sender email address
  SMTP_PASSWORD  — app password
  SMTP_HOST      — SMTP server
  SMTP_PORT      — SMTP port
  RESEND_API_KEY — Fallback API key for environments blocking SMTP
"""

from __future__ import annotations

import logging
import smtplib
import uuid
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from backend.config import (
    SMTP_EMAIL,
    SMTP_PASSWORD,
    SMTP_HOST,
    SMTP_PORT,
    EMAIL_ENABLED,
    PLATFORM_BASE_URL,
    RESEND_API_KEY,
)

try:
    import resend as _resend_module
except ImportError:
    _resend_module = None

logger = logging.getLogger(__name__)


def _generate_tracking_token() -> str:
    """Generate a unique tracking token for email link/pixel tracking."""
    return uuid.uuid4().hex


def _send_via_resend(
    recipient_email: str,
    subject: str,
    body_html: str,
    body_text: str,
    sender_name: str = "IT Security Team",
) -> dict:
    """Send an email using the Resend HTTP API (no SMTP needed)."""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set — cannot fall back to Resend.")
        return {"sent": False, "error": "RESEND_API_KEY not configured"}

    if _resend_module is None:
        logger.warning("resend package not installed — pip install resend")
        return {"sent": False, "error": "resend package not installed"}

    # Resend free plan (no verified domain) only allows sending to the
    # account owner's address.  Override the recipient so delivery succeeds
    # while keeping the original address visible in the subject line.
    RESEND_OWNER_EMAIL = "akeshchandrasiri@gmail.com"

    try:
        _resend_module.api_key = RESEND_API_KEY
        actual_to = RESEND_OWNER_EMAIL
        display_subject = (
            f"{subject}  [→ {recipient_email}]"
            if recipient_email != RESEND_OWNER_EMAIL
            else subject
        )
        params = {
            "from": f"{sender_name} <onboarding@resend.dev>",
            "to": [actual_to],
            "subject": display_subject,
            "html": body_html,
            "text": body_text,
        }
        email = _resend_module.Emails.send(params)
        logger.info("Email sent via Resend API to %s (on behalf of %s): %s",
                     actual_to, recipient_email, email)
        return {"sent": True, "resend_id": email.get("id", "")}
    except Exception as exc:
        logger.error("Resend API error: %s", exc)
        return {"sent": False, "error": f"Resend API error: {exc}"}


def send_phishing_email(
    recipient_email: str,
    subject: str,
    body_html: str,
    body_text: str,
    tracking_token: str,
    sender_name: str = "IT Security Team",
) -> dict:
    """Send a phishing simulation email, prioritizing Resend if SMTP is unconfigured."""
    email_id = f"email_{uuid.uuid4().hex[:12]}"

    result = {
        "email_id": email_id,
        "tracking_token": tracking_token,
        "sent": False,
        "mode": "log_only",
        "error": "",
    }

    if not EMAIL_ENABLED:
        logger.info(
            "Email disabled (EMAIL_ENABLED=false). Logged email %s to %s",
            email_id,
            recipient_email,
        )
        result["mode"] = "disabled"
        return result

    # ── Path A: No SMTP credentials — try Resend directly ────────
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.info(
            "SMTP not configured — trying Resend API for email %s to %s",
            email_id,
            recipient_email,
        )
        resend_result = _send_via_resend(
            recipient_email, subject, body_html, body_text, sender_name
        )
        if resend_result["sent"]:
            result["sent"] = True
            result["mode"] = "resend"
            return result
        else:
            logger.warning("Resend also unavailable: %s", resend_result.get("error"))
            result["error"] = resend_result.get("error", "No email transport available")
            return result

    # ── Path B: SMTP credentials present — try SMTP, fall back to Resend ─
    # Build MIME message
    msg = MIMEMultipart("alternative")
    msg["From"] = f"{sender_name} <{SMTP_EMAIL}>"
    msg["To"] = recipient_email
    msg["Subject"] = subject
    msg["X-Phishing-Simulation"] = "true"
    msg["X-Tracking-Token"] = tracking_token

    # Attach plain text and HTML parts
    msg.attach(MIMEText(body_text, "plain"))
    msg.attach(MIMEText(body_html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info("Email %s sent via SMTP to %s", email_id, recipient_email)
        result["sent"] = True
        result["mode"] = "smtp"
    except smtplib.SMTPAuthenticationError as exc:
        logger.error("SMTP auth failed: %s", exc)
        result["error"] = f"SMTP authentication failed: {exc}"
        logger.info("Trying Resend fallback after SMTP auth failure for %s", email_id)
        resend_result = _send_via_resend(
            recipient_email, subject, body_html, body_text, sender_name
        )
        if resend_result["sent"]:
            result["sent"] = True
            result["mode"] = "resend"
            result["error"] = ""
    except (smtplib.SMTPException, OSError, Exception) as exc:
        logger.error("SMTP error sending %s: %s", email_id, exc)
        # Fall back to Resend HTTP API for any SMTP failure (like Render blocking port 587)
        logger.info("SMTP failed — trying Resend HTTP API for email %s", email_id)
        resend_result = _send_via_resend(
            recipient_email, subject, body_html, body_text, sender_name
        )
        if resend_result["sent"]:
            result["sent"] = True
            result["mode"] = "resend"
            result["error"] = ""
        else:
            result["error"] = (
                f"SMTP: {exc} | Resend: {resend_result.get('error', 'failed')}"
            )

    return result


def generate_tracking_links(
    tracking_token: str,
    base_url: Optional[str] = None,
) -> dict:
    """Generate tracking URLs for a phishing email."""
    base = (base_url or PLATFORM_BASE_URL).rstrip("/")
    return {
        "phishing_link": f"{base}/api/email/track/{tracking_token}",
        "tracking_pixel": f"{base}/api/email/pixel/{tracking_token}",
        "training_redirect": f"{base}/api/training/landing/{tracking_token}",
    }


def create_tracking_token() -> str:
    """Public wrapper for token generation."""
    return _generate_tracking_token()
