"""SMTP email sending module for spear phishing simulation.

Sends real emails via SMTP (Gmail by default). Falls back to log-only mode
when SMTP credentials are not configured, so the platform remains fully
functional for development and demo without a mail account.

Environment variables:
  SMTP_EMAIL     — sender email address  (e.g. your-sim@gmail.com)
  SMTP_PASSWORD  — app password           (Gmail → Security → App Passwords)
  SMTP_HOST      — SMTP server            (default: smtp.gmail.com)
  SMTP_PORT      — SMTP port              (default: 587)
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
)

logger = logging.getLogger(__name__)


def _generate_tracking_token() -> str:
    """Generate a unique tracking token for email link/pixel tracking."""
    return uuid.uuid4().hex


def send_phishing_email(
    recipient_email: str,
    subject: str,
    body_html: str,
    body_text: str,
    tracking_token: str,
    sender_name: str = "IT Security Team",
) -> dict:
    """Send a phishing simulation email via SMTP.

    Parameters
    ----------
    recipient_email : str
        Target email address.
    subject : str
        Email subject line.
    body_html : str
        HTML body with tracking pixel and phishing links.
    body_text : str
        Plain-text fallback body.
    tracking_token : str
        Unique token for open/click tracking.
    sender_name : str
        Display name for the sender.

    Returns
    -------
    dict with keys:
        - email_id: unique identifier for this email
        - tracking_token: the token used
        - sent: bool — True if actually delivered via SMTP
        - mode: 'smtp' | 'log_only'
        - error: error message if sending failed, else empty string
    """
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

    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.info(
            "SMTP credentials not configured. Log-only mode for email %s to %s",
            email_id,
            recipient_email,
        )
        return result

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
    except smtplib.SMTPException as exc:
        logger.error("SMTP error sending %s: %s", email_id, exc)
        result["error"] = f"SMTP error: {exc}"
    except Exception as exc:
        logger.error("Unexpected error sending %s: %s", email_id, exc)
        result["error"] = str(exc)

    return result


def generate_tracking_links(
    tracking_token: str,
    base_url: Optional[str] = None,
) -> dict:
    """Generate tracking URLs for a phishing email.

    Returns dict with:
      - phishing_link: URL the user clicks (logged as 'click')
      - tracking_pixel: 1x1 image URL (logged as 'open')
      - training_redirect: URL user is redirected to after clicking
    """
    base = (base_url or PLATFORM_BASE_URL).rstrip("/")
    return {
        "phishing_link": f"{base}/api/email/track/{tracking_token}",
        "tracking_pixel": f"{base}/api/email/pixel/{tracking_token}",
        "training_redirect": f"{base}/api/training/landing/{tracking_token}",
    }


def create_tracking_token() -> str:
    """Public wrapper for token generation."""
    return _generate_tracking_token()
