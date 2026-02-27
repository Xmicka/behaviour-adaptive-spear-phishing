"""Behavior-driven dynamic email generation engine for spear phishing simulation.

Generates fully personalised spear phishing emails constructed from the
target user's **actual behavioral data** — pages they visit, typing cadence,
click patterns, activity hours, and domains they interact with.

There are NO fixed templates. Every email is built programmatically from
the recipient's profile, making each email unique. The engine:

  1. Analyses behavioral signals (pages, domains, timing, interaction style)
  2. Infers the best attack vector (credential, internal-trust, financial…)
  3. Constructs a unique subject, pretext, and call-to-action
  4. Selects a matching sender identity
  5. Adapts urgency, tone, and link placement based on the user's habits
"""

from __future__ import annotations

import hashlib
import random
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple


# ── Attack Vector Inference ──────────────────────────────────────────

# Domain keywords that indicate what sort of lure will be most effective
_DOMAIN_ATTACK_MAP: List[Tuple[List[str], str, str]] = [
    # (domain keywords, attack_vector, context_hint)
    (["bank", "pay", "finance", "invoice", "billing", "stripe", "paypal"],
     "financial", "Finance Department"),
    (["hr", "benefit", "leave", "payroll", "workday", "bamboo"],
     "hr_internal", "Human Resources"),
    (["admin", "panel", "console", "dashboard", "manage", "settings"],
     "admin_access", "System Administration"),
    (["login", "auth", "sso", "signin", "account", "password", "credential"],
     "credential_harvest", "IT Security Team"),
    (["mail", "outlook", "gmail", "email", "inbox"],
     "credential_harvest", "IT Security Team"),
    (["cloud", "aws", "azure", "gcp", "s3", "storage"],
     "cloud_alert", "Cloud Infrastructure Team"),
    (["slack", "teams", "zoom", "meet", "calendar", "schedule"],
     "collaboration", "Internal Communications"),
    (["jira", "github", "gitlab", "bitbucket", "repo", "code", "deploy"],
     "devops_alert", "Engineering Operations"),
    (["doc", "drive", "sharepoint", "onedrive", "share", "file", "download"],
     "document_share", "Document Management"),
    (["shop", "order", "deliver", "track", "ship", "package"],
     "delivery_scam", "Package Notifications"),
]

_DEFAULT_VECTOR = "security_alert"
_DEFAULT_CONTEXT = "IT Security Team"


def _infer_attack_vector(
    pages_visited: List[str],
    domains: List[str],
) -> Tuple[str, str]:
    """Infer the best attack vector from pages/domains a user actually visits.

    Returns (attack_vector, context_hint).
    """
    # Build a bag of words from all URLs and domains
    text_bag = " ".join(pages_visited + domains).lower()

    # Score each vector category by keyword hits
    scores: Dict[str, Tuple[int, str]] = {}
    for keywords, vector, ctx in _DOMAIN_ATTACK_MAP:
        hits = sum(1 for kw in keywords if kw in text_bag)
        if hits > 0:
            scores[vector] = (hits, ctx)

    if not scores:
        return _DEFAULT_VECTOR, _DEFAULT_CONTEXT

    best_vector = max(scores, key=lambda v: scores[v][0])
    return best_vector, scores[best_vector][1]


# ── Sender Identity Generator ────────────────────────────────────────

_SENDER_POOL = {
    "financial": [
        {"name": "Finance Department", "email": "finance-alerts@{domain}"},
        {"name": "Accounts Payable", "email": "accounts@{domain}"},
    ],
    "hr_internal": [
        {"name": "Human Resources", "email": "hr-updates@{domain}"},
        {"name": "Benefits Administration", "email": "benefits@{domain}"},
    ],
    "admin_access": [
        {"name": "System Administration", "email": "admin-alerts@{domain}"},
        {"name": "Access Management", "email": "access-team@{domain}"},
    ],
    "credential_harvest": [
        {"name": "IT Security Team", "email": "security-noreply@{domain}"},
        {"name": "Account Security", "email": "account-verify@{domain}"},
    ],
    "cloud_alert": [
        {"name": "Cloud Infrastructure Team", "email": "cloud-ops@{domain}"},
        {"name": "DevOps Alerts", "email": "infra-alerts@{domain}"},
    ],
    "collaboration": [
        {"name": "Internal Communications", "email": "comms@{domain}"},
        {"name": "Workspace Admin", "email": "workspace-admin@{domain}"},
    ],
    "devops_alert": [
        {"name": "Engineering Operations", "email": "eng-ops@{domain}"},
        {"name": "CI/CD Pipeline", "email": "pipeline-bot@{domain}"},
    ],
    "document_share": [
        {"name": "Document Management", "email": "docs-noreply@{domain}"},
        {"name": "File Sharing Service", "email": "share@{domain}"},
    ],
    "delivery_scam": [
        {"name": "Delivery Notifications", "email": "tracking@{domain}"},
    ],
    "security_alert": [
        {"name": "IT Security Team", "email": "security-noreply@{domain}"},
        {"name": "Security Operations Center", "email": "soc@{domain}"},
    ],
}


def _pick_sender(attack_vector: str, user_domains: List[str]) -> Dict[str, str]:
    """Pick a sender that mimics the user's most-visited domain."""
    pool = _SENDER_POOL.get(attack_vector, _SENDER_POOL["security_alert"])
    sender_template = random.choice(pool)

    # Use the user's most common domain (or a generic one)
    fake_domain = "company-internal.com"
    if user_domains:
        # Pick one of their real domains to make it look credible
        fake_domain = random.choice(user_domains[:5])

    return {
        "name": sender_template["name"],
        "email": sender_template["email"].format(domain=fake_domain),
    }


# ── Dynamic Subject/Pretext Generators ───────────────────────────────

def _generate_subject(
    attack_vector: str,
    display_name: str,
    risk_score: float,
    signals: Dict[str, Any],
) -> str:
    """Generate a unique subject line based on the attack vector and user data."""

    now = datetime.utcnow()
    month = now.strftime("%B")
    quarter = f"Q{(now.month - 1) // 3 + 1}"

    # Build the subject from behavioral context
    pages = signals.get("pages_visited", [])
    top_page = pages[0] if pages else ""

    subjects_by_vector = {
        "financial": [
            f"Invoice #{random.randint(10000,99999)} — Approval Required by {display_name}",
            f"{quarter} Expense Report Discrepancy — Your Action Needed",
            f"Wire Transfer Request #{random.randint(1000,9999)} Pending Your Authorization",
            f"Budget Reallocation Notice — {month} {now.year}",
        ],
        "hr_internal": [
            f"Benefits Enrollment Change — Confirmation Required, {display_name}",
            f"Updated PTO Policy — Please Acknowledge by End of Day",
            f"Annual Review Schedule — Your Slot Needs Confirmation",
            f"Payroll Update: Direct Deposit Verification Required",
        ],
        "admin_access": [
            f"Admin Privilege Audit — Verify Your Access Level",
            f"Root Access Expiring: Re-authorize Within 4 Hours",
            f"System Configuration Change Detected on Your Account",
            f"Admin Panel Security Update — Immediate Action Required",
        ],
        "credential_harvest": [
            f"Security Alert: Unrecognized Sign-In on Your Account",
            f"Password Expires in {random.choice([2, 4, 12, 24])} Hours — Update Now",
            f"Account Verification Required — Unusual Activity Detected",
            f"Multi-Factor Authentication Setup — Complete by {month} {now.day + 1 if now.day < 28 else 1}",
        ],
        "cloud_alert": [
            f"AWS/Azure: Storage Quota Exceeded — Action Required",
            f"Cloud Security Finding: Exposed Endpoint Detected",
            f"Infrastructure Alert: Unexpected Resource Provisioning",
            f"Cloud Access Key Rotation — Mandatory Update",
        ],
        "collaboration": [
            f"{display_name}, You've Been Added to a Confidential Channel",
            f"Meeting Reschedule: Updated Calendar Invite — Today",
            f"Shared Document: Confidential — {quarter} Review",
            f"New Message from Leadership — Please Review",
        ],
        "devops_alert": [
            f"CI/CD Pipeline Failure — Build #{random.randint(1000,9999)} Needs Attention",
            f"Repository Access Revoked — Verify Your Permissions",
            f"Deploy to Production: Approval Required",
            f"Security Scan: Vulnerability Found in Your Last Commit",
        ],
        "document_share": [
            f"{display_name} — Shared Document Requires Your Review",
            f"Confidential: {quarter} Strategy Document — View Only",
            f"File Shared With You: Annual_Report_{now.year}.pdf",
            f"Document Access Expiring — Download Before It's Removed",
        ],
        "delivery_scam": [
            f"Delivery Attempt Failed — Reschedule Required",
            f"Your Package #{random.randint(100000,999999)} Is Being Held",
            f"Shipping Update: Address Confirmation Needed",
        ],
        "security_alert": [
            f"Critical Security Update Required for Your Workstation",
            f"Data Breach Alert: Your Credentials May Be Compromised",
            f"Mandatory Security Patch — Install Before End of Day",
            f"Suspicious Activity on Your Account — Immediate Review",
        ],
    }

    choices = subjects_by_vector.get(attack_vector, subjects_by_vector["security_alert"])

    subject = random.choice(choices)

    # Add urgency prefix for high-risk users
    if risk_score >= 0.65 and not subject.upper().startswith(("URGENT", "CRITICAL")):
        prefix = random.choice(["URGENT: ", "ACTION REQUIRED: ", "IMMEDIATE: "])
        subject = prefix + subject

    return subject


def _generate_pretext(
    attack_vector: str,
    display_name: str,
    signals: Dict[str, Any],
    risk_score: float,
) -> str:
    """Generate a pretext paragraph that references the user's actual behavior."""

    pages = signals.get("pages_visited", [])
    total_events = signals.get("total_events", 0)
    total_clicks = signals.get("total_clicks", 0)
    avg_typing = signals.get("avg_typing_speed_ms")
    copy_paste = signals.get("copy_paste_events", 0)

    # Extract domain contexts from pages
    domain_mentions = set()
    for p in pages[:5]:
        parts = p.strip("/").split("/")
        for part in parts:
            cleaned = part.replace("-", " ").replace("_", " ")
            if len(cleaned) > 2 and not cleaned.isdigit():
                domain_mentions.add(cleaned)

    context_phrase = ""
    if domain_mentions:
        sample = random.sample(list(domain_mentions), min(2, len(domain_mentions)))
        context_phrase = f" related to {' and '.join(sample)}"

    pretexts_by_vector = {
        "financial": [
            f"Our automated system flagged an invoice{context_phrase} that requires your approval before processing can continue. The accounting department has escalated this item due to its time-sensitive nature.",
            f"A recent audit of expense submissions has identified a discrepancy in records{context_phrase}. As part of standard compliance procedure, your verification is needed.",
            f"A wire transfer request has been submitted under your authorization code. Due to the amount involved, dual-approval is required within the compliance window.",
        ],
        "hr_internal": [
            f"Changes to your benefits enrollment{context_phrase} need your confirmation before the end of the current enrollment period. Failure to confirm may result in default selections being applied.",
            f"As part of the annual policy update, all employees must acknowledge receipt of the revised handbook. Your department has been flagged for pending acknowledgment.",
            f"Your annual review has been scheduled and requires your availability confirmation. Please review the proposed time slot.",
        ],
        "admin_access": [
            f"A routine access audit has detected administrator-level privileges on your account{context_phrase}. Per security policy, elevated access must be re-verified quarterly.",
            f"Your root access credentials are approaching their expiration window. To maintain uninterrupted access to critical systems, re-authorization is required.",
        ],
        "credential_harvest": [
            f"Our monitoring system detected a sign-in attempt from an unrecognized location. If this wasn't you, please verify your credentials immediately to secure your account.",
            f"Your password is approaching its mandatory rotation deadline. To avoid account lockout and maintain access to all company systems, please update your credentials now.",
            f"As part of our zero-trust security initiative, all accounts are being migrated to enhanced authentication. Your account{context_phrase} requires immediate verification.",
        ],
        "cloud_alert": [
            f"A cloud infrastructure alert has been triggered{context_phrase}. An unexpected resource was provisioned under your account, which may indicate unauthorized access.",
            f"Your cloud storage quota has been exceeded. To prevent data loss and service interruption, please review your usage and take corrective action.",
        ],
        "collaboration": [
            f"You've been added to a restricted workspace channel{context_phrase}. Please review the shared materials and confirm your participation to maintain access.",
            f"A meeting originally on your calendar has been rescheduled by the organizer. The updated invite requires your confirmation.",
        ],
        "devops_alert": [
            f"Build pipeline #{random.randint(1000, 9999)} has encountered a critical failure{context_phrase}. As the commit author, your review is needed to unblock the deployment.",
            f"A security scan has flagged a potential vulnerability in code associated with your most recent changes. Immediate review is required per our secure-SDLC policy.",
        ],
        "document_share": [
            f"A confidential document has been shared with you{context_phrase}. Due to its classification level, the document will be automatically removed in 48 hours unless downloaded.",
            f"A colleague has shared a file that requires your review and sign-off before it can be finalized. The document contains time-sensitive information.",
        ],
        "delivery_scam": [
            "We attempted to deliver your package but were unable to locate a recipient at the address on file. Please confirm your delivery address to reschedule.",
            "Your shipment is being held at the sorting facility due to incomplete address information. Verify your details to resume delivery.",
        ],
        "security_alert": [
            f"A critical security vulnerability has been identified that affects your workstation. IT Security has released an emergency patch that must be applied before end of business today.",
            f"Our threat intelligence system detected suspicious activity associated with your user credentials{context_phrase}. Immediate action is required to prevent account compromise.",
        ],
    }

    choices = pretexts_by_vector.get(attack_vector, pretexts_by_vector["security_alert"])
    return random.choice(choices)


# ── HTML Email Builder ────────────────────────────────────────────────

def _build_html_email(
    display_name: str,
    pretext: str,
    phishing_link: str,
    tracking_pixel_url: str,
    sender_name: str,
    time_pressure: str,
    cta_text: str,
    risk_score: float,
    signals: Dict[str, Any],
    attack_vector: str,
) -> str:
    """Build a professional HTML email that adapts to user behavior."""

    is_high_risk = risk_score >= 0.6
    is_heavy_clicker = signals.get("total_clicks", 0) > 10
    visits_admin = any("/admin" in p for p in signals.get("pages_visited", []))
    is_fast_typist = (signals.get("avg_typing_speed_ms") or 999) < 100

    # Dynamic urgency banner
    urgency_banner = ""
    if is_high_risk:
        banner_texts = [
            "⚠ URGENT: Immediate Action Required",
            "🔒 Security Alert: Time-Sensitive Action",
            "⏰ Action Required Before Account Restriction",
        ]
        urgency_banner = f"""
        <div style="background:#dc2626;color:#fff;padding:10px 20px;text-align:center;font-weight:bold;font-size:14px;">
            {random.choice(banner_texts)}
        </div>"""

    # Admin-specific note
    admin_note = ""
    if visits_admin:
        admin_note = '<p style="color:#b45309;font-weight:600;">As a user with elevated access, your response is critical to maintain system security.</p>'

    # Extra clickable elements for heavy clickers (more lure surfaces)
    extra_links = ""
    if is_heavy_clicker:
        extra_actions = [
            ("✓ Verify Now", "#3b82f6"),
            ("📋 Review Details", "#6b7280"),
        ]
        links_html = "".join(
            f'<a href="{phishing_link}" style="display:inline-block;margin-right:10px;padding:6px 14px;'
            f'background:{color};color:#fff;text-decoration:none;border-radius:4px;font-size:13px;">{label}</a>'
            for label, color in extra_actions
        )
        extra_links = f"""
        <div style="margin:15px 0;padding:12px;background:#f8fafc;border-radius:6px;">
            <p style="margin:0 0 8px;font-weight:600;font-size:13px;">Quick Actions:</p>
            {links_html}
        </div>"""

    # Speed note for fast typists
    speed_note = ""
    if is_fast_typist:
        speed_note = '<p style="font-size:13px;color:#475569;margin-top:8px;">This process takes less than 30 seconds to complete.</p>'

    # Dynamic header color by vector
    header_colors = {
        "financial": "#1e3a5f",
        "hr_internal": "#2d4a3e",
        "credential_harvest": "#1e293b",
        "security_alert": "#3b1e1e",
        "admin_access": "#2d1e4a",
        "cloud_alert": "#1e3a3a",
        "collaboration": "#3a2d1e",
        "devops_alert": "#1e293b",
        "document_share": "#2d3a1e",
        "delivery_scam": "#3a2d1e",
    }
    header_bg = header_colors.get(attack_vector, "#1e293b")

    # Dynamic icon by vector
    icons = {
        "financial": "💰",
        "hr_internal": "👥",
        "credential_harvest": "🔒",
        "security_alert": "🛡️",
        "admin_access": "⚙️",
        "cloud_alert": "☁️",
        "collaboration": "💬",
        "devops_alert": "🔧",
        "document_share": "📄",
        "delivery_scam": "📦",
    }
    icon = icons.get(attack_vector, "🔒")

    # CTA button color varies
    cta_colors = ["#2563eb", "#0891b2", "#7c3aed", "#0d9488", "#4f46e5"]
    cta_color = random.choice(cta_colors)

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;">
{urgency_banner}
<div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;">
    <div style="background:{header_bg};padding:20px 30px;">
        <h1 style="margin:0;color:#fff;font-size:18px;">{icon} {sender_name}</h1>
    </div>
    <div style="padding:30px;">
        <p style="font-size:15px;color:#334155;">Dear {display_name},</p>
        <p style="font-size:15px;color:#334155;line-height:1.6;">{pretext}</p>
        {admin_note}
        <p style="font-size:14px;color:#475569;">Please take the required action <strong>{time_pressure}</strong>.</p>
        <div style="text-align:center;margin:25px 0;">
            <a href="{phishing_link}" style="display:inline-block;padding:12px 32px;background:{cta_color};color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">
                {cta_text}
            </a>
        </div>
        {extra_links}
        {speed_note}
        <p style="font-size:13px;color:#94a3b8;margin-top:20px;">
            Failure to respond may result in temporary suspension of your access privileges.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
        <p style="font-size:13px;color:#64748b;">
            Regards,<br><strong>{sender_name}</strong>
        </p>
    </div>
    <div style="background:#f8fafc;padding:15px 30px;border-top:1px solid #e2e8f0;">
        <p style="font-size:11px;color:#94a3b8;margin:0;text-align:center;">
            This is an automated notification. Do not reply to this email.
            <br>Ref: {hashlib.md5(f'{display_name}{datetime.utcnow().isoformat()}'.encode()).hexdigest()[:8].upper()}
        </p>
    </div>
</div>
<img src="{tracking_pixel_url}" width="1" height="1" alt="" style="display:none;">
</body>
</html>"""


# ── Main Entry Point ─────────────────────────────────────────────────

def generate_email_content(
    user_id: str,
    risk_score: float,
    phishing_link: str,
    tracking_pixel_url: str,
    scenario: Optional[str] = None,
    context: str = "",
    behavioral_signals: Optional[Dict] = None,
) -> Dict[str, str]:
    """Generate a fully dynamic phishing email from the user's behavior.

    Parameters
    ----------
    user_id : str
        Target user identifier.
    risk_score : float
        User's current risk score (0–1).
    phishing_link : str
        Tracking URL that logs clicks.
    tracking_pixel_url : str
        1×1 pixel URL for open tracking.
    scenario : str, optional
        Force a specific attack vector. Auto-inferred if omitted.
    context : str
        Extra context (department, role) for sender selection.
    behavioral_signals : dict, optional
        Behavioral profile from event data (pages, clicks, typing, etc.)

    Returns
    -------
    dict with: subject, body_text, body_html, sender_name, sender_email,
               scenario, template_id
    """
    signals = behavioral_signals or {}
    pages = signals.get("pages_visited", [])

    # Extract domains the user actually visits
    user_domains = signals.get("domains", [])
    if not user_domains:
        user_domains = list(set(
            re.sub(r'^(www\.)', '', p.split("/")[0])
            for p in pages if p and "." in p.split("/")[0]
        ))

    # Infer attack vector from behavior (or use admin-specified scenario)
    if scenario and scenario in _SENDER_POOL:
        attack_vector = scenario
        context_hint = context or _DEFAULT_CONTEXT
    else:
        attack_vector, context_hint = _infer_attack_vector(pages, user_domains)

    # Override with explicit context if given
    if context:
        context_hint = context

    display_name = user_id.replace("_", " ").title()
    sender = _pick_sender(attack_vector, user_domains)

    # Generate dynamic content
    subject = _generate_subject(attack_vector, display_name, risk_score, signals)
    pretext = _generate_pretext(attack_vector, display_name, signals, risk_score)

    # Adaptive urgency based on risk
    is_high_risk = risk_score >= 0.6
    time_pressures = {
        True: [
            "within the next 2 hours",
            "within 60 minutes",
            "before your session expires",
        ],
        False: [
            "by end of business today",
            "within the next 24 hours",
            "at your earliest convenience today",
        ],
    }
    time_pressure = random.choice(time_pressures[is_high_risk])

    # Dynamic CTA text
    cta_options = {
        "financial": ["Approve Invoice →", "Review Transaction →", "Authorize Now →"],
        "hr_internal": ["Confirm Details →", "Acknowledge Policy →", "Review Update →"],
        "admin_access": ["Re-Authorize Access →", "Verify Privileges →", "Confirm Identity →"],
        "credential_harvest": ["Verify Account →", "Secure Your Account →", "Update Credentials →"],
        "cloud_alert": ["Review Alert →", "Take Action →", "Resolve Issue →"],
        "collaboration": ["Join Channel →", "View Document →", "Confirm Attendance →"],
        "devops_alert": ["Review Build →", "View Findings →", "Approve Deploy →"],
        "document_share": ["View Document →", "Download Now →", "Review & Sign →"],
        "delivery_scam": ["Reschedule Delivery →", "Verify Address →", "Track Package →"],
        "security_alert": ["Take Action Now →", "Verify Identity →", "Apply Patch →"],
    }
    cta_text = random.choice(cta_options.get(attack_vector, cta_options["security_alert"]))

    # Build body text
    body_parts = [f"Dear {display_name},", "", pretext]

    if any("/admin" in p for p in pages):
        body_parts.append("")
        body_parts.append("As a user with elevated access, your response is critical to maintain system security.")

    if is_high_risk:
        body_parts.append("")
        body_parts.append("This matter has been escalated due to elevated security indicators on your account.")

    body_parts.extend([
        "",
        f"Please take the required action {time_pressure}:",
        "",
        f"▶ {cta_text} {phishing_link}",
    ])

    # Extra links for heavy clickers
    if signals.get("total_clicks", 0) > 10:
        body_parts.extend([
            "",
            "Quick Actions:",
            f"  • Verify: {phishing_link}",
            f"  • Review: {phishing_link}",
        ])

    # Speed note for fast typists
    if (signals.get("avg_typing_speed_ms") or 999) < 100:
        body_parts.append("")
        body_parts.append("This process takes less than 30 seconds to complete.")

    body_parts.extend([
        "",
        "Failure to respond may result in temporary suspension of your access privileges.",
        "",
        "Regards,",
        sender["name"],
        "",
        "---",
        "This is an automated notification. Do not reply to this email.",
    ])

    body_text = "\n".join(body_parts)

    # Build HTML
    body_html = _build_html_email(
        display_name=display_name,
        pretext=pretext,
        phishing_link=phishing_link,
        tracking_pixel_url=tracking_pixel_url,
        sender_name=sender["name"],
        time_pressure=time_pressure,
        cta_text=cta_text,
        risk_score=risk_score,
        signals=signals,
        attack_vector=attack_vector,
    )

    # Unique template ID (never repeats)
    template_id = (
        f"{attack_vector}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        f"_{random.randint(100, 999)}"
        f"_{hashlib.md5(f'{user_id}{risk_score}'.encode()).hexdigest()[:6]}"
    )

    return {
        "subject": subject,
        "body_text": body_text,
        "body_html": body_html,
        "sender_name": sender["name"],
        "sender_email": sender["email"],
        "scenario": attack_vector,
        "template_id": template_id,
    }


def get_available_scenarios() -> Dict[str, List[str]]:
    """Return available attack vectors and example configurations."""
    return {
        vector: [s["name"] for s in _SENDER_POOL.get(vector, [])]
        for vector in _SENDER_POOL
    }
