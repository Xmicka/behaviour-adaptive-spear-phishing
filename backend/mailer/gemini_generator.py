"""Gemini API-based phishing email generator.

Dynamically generates personalized phishing emails using Google's Gemini API.
Provides fallback to template generation if API is unavailable.

Environment variables:
  GEMINI_API_KEY  - Google Gemini API key
"""

import logging
import os
from typing import Dict, Optional

logger = logging.getLogger(__name__)


def _fallback_template(
    user_role: str,
    scenario: str,
    context: str = ""
) -> Dict[str, str]:
    """Generate email using template fallback when API unavailable."""
    
    templates = {
        ("credential_harvest", "executive"): {
            "subject": "Urgent: Board Meeting Attendance Verification Required",
            "body": "Dear Executive,\n\nTo confirm your attendance at the upcoming board meeting, please verify your credentials through our secure portal.\n\nVerify Now: {link}\n\nRegards,\nBoard Office"
        },
        ("credential_harvest", "engineer"): {
            "subject": "Security Alert: Unusual GitHub Activity Detected",
            "body": "Hello,\n\nWe detected unusual activity on your GitHub account. Please verify your identity to secure your repositories.\n\nVerify Access: {link}\n\nThank you,\nSecurity Team"
        },
        ("social_engineering", "default"): {
            "subject": "Important: System Security Update Required",
            "body": "Dear User,\n\nYour system requires an important security update. Please click below to begin the update process.\n\nApply Update: {link}\n\nIT Security Team"
        },
        ("malware_delivery", "default"): {
            "subject": "Document Requires Your Review",
            "body": "A document has been shared with you and requires your review. Please access it using the link below.\n\nAccess Document: {link}\n\nSharing Service"
        }
    }
    
    # Try scenario + role, fall back to scenario + default, then to generic
    template = None
    for key in [(scenario, user_role), (scenario, "default"), ("social_engineering", "default")]:
        if key in templates:
            template = templates[key]
            break
    
    if not template:
        template = {
            "subject": f"Action Required: {scenario.replace('_', ' ').title()}",
            "body": f"Dear User,\n\nAction is required on your account. Please click the link below to proceed.\n\nTake Action: {{link}}\n\nThank you"
        }
    
    return {
        "subject": template["subject"],
        "body": template["body"],
        "method": "template"
    }


def generate_phishing_email(
    target_user_role: str,
    scenario: str,
    context: str = "",
    behavioral_signals: Optional[Dict] = None,
    tracking_link: str = ""
) -> Dict[str, str]:
    """Generate a phishing email using Gemini API with fallback.
    
    Args:
        target_user_role: Role/department of target (e.g., 'engineer', 'finance')
        scenario: Attack scenario (e.g., 'credential_harvest', 'social_engineering')
        context: Optional context about the target
        behavioral_signals: Optional behavioral metrics about the user
        tracking_link: Link to include in the email (will be injected)
    
    Returns:
        Dict with 'subject', 'body', and 'method' keys
        where method is 'gemini' or 'template'
    """
    
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    
    if not api_key:
        logger.debug("Gemini API key not configured, using template generation")
        return _fallback_template(target_user_role, scenario, context)
    
    try:
        import google.generativeai as genai
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-pro")
        
        # Build the prompt
        prompt = f"""Generate a realistic but obviously phishing email for a security awareness training.

Target Role: {target_user_role}
Attack Scenario: {scenario}
Context: {context or 'Professional environment'}
Behavioral Profile: {str(behavioral_signals or {})}

Requirements:
1. Subject line should be urgent and relevant to the target role
2. Body should be personalizable and include a clear call-to-action (CTA)
3. Use common phishing techniques but make it realistic for training
4. Keep it concise (2-3 paragraphs)
5. Return ONLY the email content, no explanations

Format your response as:
SUBJECT: [subject line]
BODY: [email body]"""

        response = model.generate_content(prompt)
        
        if not response or not response.text:
            logger.warning("Gemini API returned empty response")
            return _fallback_template(target_user_role, scenario, context)
        
        # Parse the response
        text = response.text
        lines = text.split('\n')
        
        subject = ""
        body = ""
        in_body = False
        
        for line in lines:
            if line.startswith("SUBJECT:"):
                subject = line.replace("SUBJECT:", "").strip()
            elif line.startswith("BODY:"):
                in_body = True
                body = line.replace("BODY:", "").strip() + "\n"
            elif in_body:
                body += line + "\n"
        
        if not subject or not body:
            logger.warning("Could not parse Gemini response, using fallback")
            return _fallback_template(target_user_role, scenario, context)
        
        return {
            "subject": subject,
            "body": body.strip(),
            "method": "gemini"
        }
        
    except ImportError:
        logger.warning("google-generativeai not installed, using template generation")
        return _fallback_template(target_user_role, scenario, context)
    except Exception as e:
        logger.error(f"Gemini API error: {e}, falling back to templates")
        return _fallback_template(target_user_role, scenario, context)


def enhance_email_with_tracking(
    email_content: Dict[str, str],
    tracking_link: str,
    tracking_pixel: str
) -> Dict[str, str]:
    """Enhance generated email with tracking links and pixels.
    
    Args:
        email_content: Dict with 'subject', 'body', 'method'
        tracking_link: The phishing link to inject
        tracking_pixel: Tracking pixel URL for open detection
    
    Returns:
        Enhanced email dict with body_html and body_text
    """
    
    body_text = email_content["body"]
    
    # Inject tracking link (replace {link} placeholder or add at end)
    if "{link}" in body_text:
        body_text = body_text.replace("{link}", tracking_link)
    else:
        body_text += f"\n\nVerify Here: {tracking_link}"
    
    # Create HTML version
    body_html = body_text.replace("\n", "<br/>")
    body_html += f'<img src="{tracking_pixel}" style="display:none;" />'
    
    return {
        "subject": email_content["subject"],
        "body": body_text,
        "body_html": f"<p>{body_html}</p>",
        "method": email_content.get("method", "template")
    }
