"""Interactive training page generator — builds engaging, multi-step training HTML.

Replaces the old static bullet-point pages with interactive training that
includes animated reveals, scenario-specific quizzes, and progress tracking.

Each training page is dynamically generated based on:
  - The attack scenario the user fell for
  - Their risk score
  - Their behavioral profile
"""

from __future__ import annotations

import random
from typing import Dict, Optional


# ── Scenario-specific quiz questions ──────────────────────────────────

_QUIZZES = {
    "credential_harvest": [
        {
            "q": "You receive an email claiming your password will expire in 2 hours. What should you do first?",
            "options": [
                "Click the link in the email to update your password immediately",
                "Check if the sender email matches your company's official domain",
                "Reply to the email asking for more time",
                "Forward it to your colleagues to warn them",
            ],
            "correct": 1,
            "explain": "Always verify the sender's email domain. Legitimate IT teams use official company domains, not look-alike addresses.",
        },
        {
            "q": "What is the BEST way to check if a link in an email is legitimate?",
            "options": [
                "Click it to see where it goes",
                "Check if it has HTTPS",
                "Hover over it to preview the actual URL destination",
                "If the email looks professional, the link is safe",
            ],
            "correct": 2,
            "explain": "Hovering reveals the real destination URL. Phishing links often disguise themselves behind legitimate-looking text.",
        },
        {
            "q": "A 'security alert' email asks you to verify your credentials. Which red flag should concern you most?",
            "options": [
                "The email uses the company logo",
                "The email creates extreme urgency ('act within 1 hour')",
                "The email was sent during business hours",
                "The email mentions your department",
            ],
            "correct": 1,
            "explain": "Extreme urgency is the #1 social engineering technique. Attackers pressure you to act before thinking critically.",
        },
    ],
    "financial": [
        {
            "q": "You receive an invoice approval request from an unfamiliar email address. What should you do?",
            "options": [
                "Approve it quickly to avoid delays",
                "Forward it to finance without checking",
                "Verify the invoice through your company's official procurement system independently",
                "Reply asking for the invoice number",
            ],
            "correct": 2,
            "explain": "Always verify financial requests through official channels, never through the email itself.",
        },
        {
            "q": "A wire transfer request comes from what appears to be your CEO's email. What's the best response?",
            "options": [
                "Process it immediately since it's from leadership",
                "Call or message the CEO directly using their known phone number to verify",
                "Check if the amount seems reasonable",
                "Forward it to your manager for their approval",
            ],
            "correct": 1,
            "explain": "CEO fraud (Business Email Compromise) cost businesses $2.7B in 2023. Always verify via a separate channel.",
        },
        {
            "q": "An email claims there's a discrepancy in your expense report with a link to 'review details.' What's suspicious?",
            "options": [
                "The email mentions specific amounts",
                "The company logo appears correct",
                "The link goes to a domain that doesn't match your company's systems",
                "The email was sent on a weekday",
            ],
            "correct": 2,
            "explain": "Always check link destinations. Legitimate company systems use your company's official domain.",
        },
    ],
    "hr_internal": [
        {
            "q": "An email claims your benefits enrollment is about to close and provides a link to 'confirm selections.' What should you do?",
            "options": [
                "Click immediately — you don't want to miss the deadline",
                "Log into your HR portal directly (not using the email link) to check",
                "Reply asking for an extension",
                "Ignore it since you already enrolled",
            ],
            "correct": 1,
            "explain": "Navigate to HR portals directly via bookmarks or company intranet — never through email links.",
        },
        {
            "q": "What makes internal-themed phishing emails particularly dangerous?",
            "options": [
                "They use company letterhead",
                "They exploit trust in colleagues and internal departments",
                "They are always sent at night",
                "They contain attachments",
            ],
            "correct": 1,
            "explain": "Internal-themed emails exploit organizational trust. We're more likely to click when we think it's from HR, IT, or a colleague.",
        },
    ],
    "admin_access": [
        {
            "q": "You receive an alert that your admin privileges need re-verification. What's the safest action?",
            "options": [
                "Use the link provided to re-verify quickly",
                "Contact IT support through your company's ticketing system to confirm",
                "Ignore it — if it were real, IT would call you",
                "Forward the email to your team",
            ],
            "correct": 1,
            "explain": "Admin accounts are high-value targets. Always verify access changes through official IT support channels.",
        },
    ],
    "security_alert": [
        {
            "q": "An email claims your workstation has a critical vulnerability and provides a 'patch download' link. What should you do?",
            "options": [
                "Download and install the patch immediately",
                "Wait for IT to push updates through the official software deployment system",
                "Check if the link is HTTPS",
                "Forward it to colleagues so they can patch too",
            ],
            "correct": 1,
            "explain": "IT departments deploy patches through centralized systems (e.g., WSUS, Intune), never via email download links.",
        },
        {
            "q": "Which of these is a common indicator of a phishing email?",
            "options": [
                "Generic greeting ('Dear User') instead of your name",
                "Sent during business hours",
                "Uses company colors",
                "Comes from a .com domain",
            ],
            "correct": 0,
            "explain": "Generic greetings suggest mass phishing. Targeted spear phishing may use your name, but generic greetings are a clear red flag.",
        },
    ],
}

# Fallback quiz for any scenario not explicitly mapped
_DEFAULT_QUIZ = [
    {
        "q": "You receive an unexpected email asking you to take urgent action. What's the FIRST thing you should do?",
        "options": [
            "Click the link to learn more about the issue",
            "Delete the email without reading",
            "Pause, verify the sender and the request through a separate channel",
            "Forward it to everyone in your department",
        ],
        "correct": 2,
        "explain": "The 'Pause and Verify' habit is your strongest defense. Always verify unexpected requests through official channels.",
    },
    {
        "q": "Which of these techniques do attackers use to make phishing emails convincing?",
        "options": [
            "Impersonating trusted brands and internal departments",
            "Creating a sense of urgency",
            "Mimicking legitimate email designs",
            "All of the above",
        ],
        "correct": 3,
        "explain": "Attackers combine multiple techniques — brand spoofing, urgency, and professional design — to increase click rates.",
    },
    {
        "q": "What should you do if you accidentally click a suspicious link?",
        "options": [
            "Ignore it and hope nothing happens",
            "Immediately report it to IT/Security and change your passwords",
            "Close the browser and continue working",
            "Ask a colleague for advice before telling IT",
        ],
        "correct": 1,
        "explain": "Speed matters in incident response. Report immediately and change passwords — early detection prevents breaches.",
    },
]


# ── Red flags by scenario ─────────────────────────────────────────────

_RED_FLAGS = {
    "credential_harvest": [
        ("Urgency Pressure", "The email created artificial time pressure to make you act without thinking"),
        ("Credential Request", "Legitimate services never ask you to verify credentials via email links"),
        ("Suspicious URL", "The link destination didn't match the company's official domain"),
        ("Generic Threat", "Vague 'security issues' without specific details are a phishing hallmark"),
    ],
    "financial": [
        ("Unusual Request", "Financial requests should always be verified through procurement systems"),
        ("Authority Exploitation", "Attackers impersonate executives to bypass normal approval processes"),
        ("Missing Context", "Legitimate invoices reference existing purchase orders and vendor relationships"),
    ],
    "hr_internal": [
        ("Internal Trust", "The email exploited your trust in internal departments like HR"),
        ("Deadline Pressure", "Artificial deadlines push you to act before verifying"),
        ("Personal Impact", "Benefits/payroll topics create personal urgency that bypasses caution"),
    ],
    "admin_access": [
        ("Privilege Targeting", "Admin accounts are high-value targets worth extra verification"),
        ("Access Urgency", "Claims of expiring access create pressure to click first, think later"),
        ("Impersonation", "The sender impersonated IT/admin teams to appear legitimate"),
    ],
    "security_alert": [
        ("Fear-Based Appeal", "Security alerts use fear to trigger immediate action"),
        ("Fake Patch/Update", "Real patches come through centralized IT systems, not emails"),
        ("Authority Impersonation", "Security team impersonation is a common phishing technique"),
    ],
}

_DEFAULT_RED_FLAGS = [
    ("Urgency Language", "The email created artificial urgency to bypass your critical thinking"),
    ("Unexpected Request", "You received an unexpected action request from an unverified source"),
    ("Suspicious Link", "The link didn't match official company domains"),
]


def _get_quiz_questions(scenario: str, count: int = 3):
    """Get quiz questions appropriate for the attack scenario."""
    # Map scenario variants
    scenario_key = scenario.lower().replace("-", "_").replace(" ", "_")
    for key in _QUIZZES:
        if key in scenario_key or scenario_key in key:
            pool = _QUIZZES[key]
            return random.sample(pool, min(count, len(pool)))

    return random.sample(_DEFAULT_QUIZ, min(count, len(_DEFAULT_QUIZ)))


def _get_red_flags(scenario: str):
    """Get red flags for the scenario."""
    scenario_key = scenario.lower().replace("-", "_").replace(" ", "_")
    for key in _RED_FLAGS:
        if key in scenario_key or scenario_key in key:
            return _RED_FLAGS[key]
    return _DEFAULT_RED_FLAGS


# ── Interactive Training Page Generator ───────────────────────────────

def generate_training_page(
    tracking_token: str,
    user_id: str,
    scenario: str,
    subject: str,
    risk_score: float,
    complete_url: str,
) -> str:
    """Generate a multi-step interactive training page.

    Steps:
      1. Reveal — animated "this was a simulation" with specific red flags
      2. Learn — scenario-specific security lessons
      3. Quiz — must answer all questions correctly to proceed
      4. Complete — badge with score and next steps
    """
    red_flags = _get_red_flags(scenario)
    quiz = _get_quiz_questions(scenario, count=3)
    scenario_display = scenario.replace("_", " ").title()

    # Build red flags HTML
    red_flags_html = ""
    for i, (title, desc) in enumerate(red_flags):
        red_flags_html += f"""
        <div class="flag" style="animation-delay: {0.3 + i * 0.2}s">
            <div class="flag-icon">🚩</div>
            <div class="flag-content">
                <strong>{title}</strong>
                <p>{desc}</p>
            </div>
        </div>"""

    # Build quiz HTML (generated as JSON for JS to render)
    quiz_json_items = []
    for i, q in enumerate(quiz):
        options_str = ", ".join(f'"{opt}"' for opt in q["options"])
        quiz_json_items.append(
            f'{{"q": "{q["q"]}", "options": [{options_str}], '
            f'"correct": {q["correct"]}, "explain": "{q["explain"]}"}}'
        )
    quiz_json = "[" + ",\n".join(quiz_json_items) + "]"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Security Awareness Training</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
            color: #e2e8f0;
            min-height: 100vh;
        }}
        .container {{ max-width: 720px; margin: 0 auto; padding: 24px 20px; }}

        /* Progress bar */
        .progress-bar {{
            display: flex; gap: 8px; margin-bottom: 32px;
        }}
        .progress-step {{
            flex: 1; height: 6px; border-radius: 3px;
            background: #334155; transition: background 0.4s ease;
        }}
        .progress-step.active {{ background: linear-gradient(90deg, #3b82f6, #8b5cf6); }}
        .progress-step.done {{ background: #22c55e; }}

        /* Steps */
        .step {{ display: none; animation: fadeInUp 0.5s ease; }}
        .step.active {{ display: block; }}

        @keyframes fadeInUp {{
            from {{ opacity: 0; transform: translateY(20px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}

        /* Cards */
        .card {{
            background: rgba(30, 41, 59, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 20px;
        }}

        /* Alert banner */
        .alert-banner {{
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            border-radius: 16px;
            padding: 28px;
            text-align: center;
            margin-bottom: 24px;
            animation: pulseAlert 2s ease infinite;
        }}
        @keyframes pulseAlert {{
            0%, 100% {{ box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }}
            50% {{ box-shadow: 0 0 0 12px rgba(220, 38, 38, 0); }}
        }}
        .alert-banner h1 {{
            color: #fff; font-size: 22px; display: flex;
            align-items: center; justify-content: center; gap: 10px;
        }}
        .alert-banner .icon {{ font-size: 32px; animation: shake 0.5s ease; }}
        @keyframes shake {{
            0%, 100% {{ transform: rotate(0); }}
            25% {{ transform: rotate(-10deg); }}
            75% {{ transform: rotate(10deg); }}
        }}

        /* Section headers */
        h2 {{
            font-size: 20px; margin-bottom: 16px;
            background: linear-gradient(90deg, #38bdf8, #818cf8);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }}
        h3 {{ color: #94a3b8; font-size: 14px; text-transform: uppercase;
             letter-spacing: 1px; margin-bottom: 12px; }}

        /* Red flags */
        .flag {{
            display: flex; gap: 14px; padding: 16px;
            background: rgba(239, 68, 68, 0.08);
            border-left: 3px solid #ef4444;
            border-radius: 0 8px 8px 0;
            margin-bottom: 12px;
            animation: slideIn 0.5s ease both;
        }}
        @keyframes slideIn {{
            from {{ opacity: 0; transform: translateX(-20px); }}
            to {{ opacity: 1; transform: translateX(0); }}
        }}
        .flag-icon {{ font-size: 24px; flex-shrink: 0; }}
        .flag-content p {{ color: #94a3b8; font-size: 14px; margin-top: 4px; line-height: 1.5; }}

        /* Scenario badge */
        .scenario-badge {{
            display: inline-flex; align-items: center; gap: 6px;
            padding: 6px 16px; border-radius: 20px;
            background: rgba(251, 191, 36, 0.15);
            color: #fbbf24; font-weight: 600; font-size: 14px;
            margin: 12px 0;
        }}

        /* Quiz */
        .quiz-question {{
            font-size: 16px; font-weight: 600; color: #e2e8f0;
            line-height: 1.5; margin-bottom: 16px;
        }}
        .quiz-counter {{
            color: #64748b; font-size: 13px; margin-bottom: 8px;
        }}
        .quiz-option {{
            display: block; width: 100%; padding: 14px 18px;
            background: rgba(51, 65, 85, 0.5);
            border: 2px solid #334155;
            border-radius: 10px;
            color: #e2e8f0; font-size: 15px;
            cursor: pointer; margin-bottom: 10px;
            transition: all 0.2s ease;
            text-align: left;
        }}
        .quiz-option:hover:not(.disabled) {{
            border-color: #3b82f6;
            background: rgba(59, 130, 246, 0.1);
            transform: translateX(4px);
        }}
        .quiz-option.correct {{
            border-color: #22c55e; background: rgba(34, 197, 94, 0.15);
            animation: correctPulse 0.5s ease;
        }}
        @keyframes correctPulse {{
            0% {{ transform: scale(1); }}
            50% {{ transform: scale(1.02); }}
            100% {{ transform: scale(1); }}
        }}
        .quiz-option.wrong {{
            border-color: #ef4444; background: rgba(239, 68, 68, 0.1);
            animation: wrongShake 0.4s ease;
        }}
        @keyframes wrongShake {{
            0%, 100% {{ transform: translateX(0); }}
            25% {{ transform: translateX(-8px); }}
            75% {{ transform: translateX(8px); }}
        }}
        .quiz-option.disabled {{ cursor: default; opacity: 0.6; }}
        .quiz-explain {{
            display: none; padding: 14px 18px;
            background: rgba(34, 197, 94, 0.08);
            border: 1px solid rgba(34, 197, 94, 0.2);
            border-radius: 10px;
            color: #86efac; font-size: 14px; line-height: 1.5;
            margin: 12px 0;
        }}
        .quiz-explain.show {{ display: block; animation: fadeInUp 0.3s ease; }}

        /* Score display */
        .score-circle {{
            width: 140px; height: 140px; border-radius: 50%;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            margin: 0 auto 20px;
            font-size: 40px; font-weight: 700;
            transition: all 0.5s ease;
        }}
        .score-circle.pass {{
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05));
            border: 3px solid #22c55e; color: #22c55e;
        }}
        .score-circle.fail {{
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05));
            border: 3px solid #ef4444; color: #ef4444;
        }}
        .score-label {{ font-size: 13px; color: #94a3b8; margin-top: 4px; }}

        /* Buttons */
        .btn {{
            display: inline-flex; align-items: center; gap: 8px;
            padding: 14px 32px;
            border: none; border-radius: 10px;
            font-size: 16px; font-weight: 600;
            cursor: pointer; text-decoration: none;
            transition: all 0.2s ease;
        }}
        .btn:hover {{ transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }}
        .btn-primary {{ background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; }}
        .btn-success {{ background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; }}
        .btn-warning {{ background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; }}
        .btn-center {{ display: flex; justify-content: center; margin-top: 24px; }}

        /* Tips */
        .tip-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }}
        @media (max-width: 600px) {{ .tip-grid {{ grid-template-columns: 1fr; }} }}
        .tip-card {{
            padding: 16px; border-radius: 10px;
            background: rgba(51, 65, 85, 0.4);
            border: 1px solid rgba(148, 163, 184, 0.1);
        }}
        .tip-card .emoji {{ font-size: 24px; margin-bottom: 8px; }}
        .tip-card h4 {{ color: #e2e8f0; font-size: 14px; margin-bottom: 6px; }}
        .tip-card p {{ color: #94a3b8; font-size: 13px; line-height: 1.5; }}

        /* Completion badge */
        .completion-badge {{
            text-align: center; padding: 40px;
        }}
        .completion-badge .trophy {{ font-size: 72px; margin-bottom: 16px; animation: bounce 1s ease; }}
        @keyframes bounce {{
            0%, 100% {{ transform: translateY(0); }}
            50% {{ transform: translateY(-20px); }}
        }}
        .completion-badge h1 {{ color: #34d399; font-size: 26px; margin-bottom: 8px; }}
        .completion-badge .subtitle {{ color: #94a3b8; font-size: 16px; }}

        p {{ line-height: 1.7; color: #94a3b8; }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Progress bar -->
        <div class="progress-bar">
            <div class="progress-step active" id="prog1"></div>
            <div class="progress-step" id="prog2"></div>
            <div class="progress-step" id="prog3"></div>
            <div class="progress-step" id="prog4"></div>
        </div>

        <!-- STEP 1: Reveal -->
        <div class="step active" id="step1">
            <div class="alert-banner">
                <h1><span class="icon">⚠️</span> This Was a Phishing Simulation</h1>
            </div>
            <div class="card">
                <h2>You Clicked a Simulated Phishing Link</h2>
                <p>This email was part of a <strong style="color:#fbbf24">security awareness training exercise</strong>.
                   In a real attack, clicking this link could have compromised your account, installed malware, or given
                   attackers access to sensitive data.</p>
                <div class="scenario-badge">🎯 Attack Type: {scenario_display}</div>
            </div>
            <div class="card">
                <h3>🚩 Red Flags You Missed</h3>
                {red_flags_html}
            </div>
            <div class="btn-center">
                <button class="btn btn-primary" onclick="goToStep(2)">Continue to Training →</button>
            </div>
        </div>

        <!-- STEP 2: Learn -->
        <div class="step" id="step2">
            <div class="card">
                <h2>🎓 Security Awareness: {scenario_display}</h2>
                <p>Learn the key techniques attackers use in <strong style="color:#fbbf24">{scenario_display}</strong> attacks
                   and how to protect yourself going forward.</p>
            </div>
            <div class="card">
                <h3>🛡️ Defense Techniques</h3>
                <div class="tip-grid">
                    <div class="tip-card">
                        <div class="emoji">🔍</div>
                        <h4>Verify the Sender</h4>
                        <p>Check the full email address, not just the display name. Look for misspellings or unusual domains.</p>
                    </div>
                    <div class="tip-card">
                        <div class="emoji">🖱️</div>
                        <h4>Hover Before Clicking</h4>
                        <p>Always hover over links to see the actual URL. If it doesn't match the expected domain, don't click.</p>
                    </div>
                    <div class="tip-card">
                        <div class="emoji">⏸️</div>
                        <h4>Pause on Urgency</h4>
                        <p>Urgency is the #1 manipulation technique. Legitimate requests rarely have 1-hour deadlines.</p>
                    </div>
                    <div class="tip-card">
                        <div class="emoji">📞</div>
                        <h4>Verify Via Another Channel</h4>
                        <p>If unsure, contact the sender through a known phone number or Slack/Teams — NOT by replying to the email.</p>
                    </div>
                    <div class="tip-card">
                        <div class="emoji">🚨</div>
                        <h4>Report Suspicious Emails</h4>
                        <p>Use the "Report Phishing" button in your email client. Early reporting protects the entire organization.</p>
                    </div>
                    <div class="tip-card">
                        <div class="emoji">🔒</div>
                        <h4>Use Official Portals</h4>
                        <p>Never enter credentials through email links. Navigate directly to official sites via bookmarks.</p>
                    </div>
                </div>
            </div>
            <div class="btn-center">
                <button class="btn btn-warning" onclick="goToStep(3)">Take the Quiz →</button>
            </div>
        </div>

        <!-- STEP 3: Quiz -->
        <div class="step" id="step3">
            <div class="card">
                <h2>📝 Knowledge Check</h2>
                <p>Answer all questions correctly to complete your training. You must score 100% to proceed.</p>
                <div id="quiz-container"></div>
                <div id="quiz-result" style="display:none; text-align:center; margin-top:20px;"></div>
            </div>
        </div>

        <!-- STEP 4: Complete -->
        <div class="step" id="step4">
            <div class="card completion-badge">
                <div class="trophy">🏆</div>
                <h1>Micro-Training Complete!</h1>
                <p class="subtitle">You've demonstrated understanding of phishing threats</p>
            </div>
            <div class="card" id="score-card" style="text-align:center;">
            </div>
            <div class="card" style="border: 2px solid #f59e0b;">
                <h2 style="background: linear-gradient(90deg, #f59e0b, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">📚 Step 2: Mandatory Security Training</h2>
                <p>To become fully compliant, complete the comprehensive security awareness training below. This covers advanced phishing recognition, password security, and data protection.</p>
                <div class="btn-center" style="flex-direction: column; gap: 12px; align-items: center;">
                    <a class="btn btn-primary" href="{complete_url}" style="text-decoration:none;">
                        ✓ Complete Training & Mark as Done
                    </a>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Quiz data
        var quizData = {quiz_json};
        var currentQuestion = 0;
        var correctCount = 0;
        var totalQuestions = quizData.length;
        var attempts = 0;

        function goToStep(n) {{
            document.querySelectorAll('.step').forEach(function(s) {{ s.classList.remove('active'); }});
            document.getElementById('step' + n).classList.add('active');

            for (var i = 1; i <= 4; i++) {{
                var el = document.getElementById('prog' + i);
                el.classList.remove('active', 'done');
                if (i < n) el.classList.add('done');
                if (i === n) el.classList.add('active');
            }}

            window.scrollTo({{ top: 0, behavior: 'smooth' }});

            if (n === 3) renderQuestion();
        }}

        function renderQuestion() {{
            var container = document.getElementById('quiz-container');
            if (currentQuestion >= totalQuestions) {{
                showQuizResult();
                return;
            }}

            var q = quizData[currentQuestion];
            var html = '<div class="quiz-counter">Question ' + (currentQuestion + 1) + ' of ' + totalQuestions + '</div>';
            html += '<div class="quiz-question">' + q.q + '</div>';

            for (var i = 0; i < q.options.length; i++) {{
                html += '<button class="quiz-option" data-idx="' + i + '" onclick="selectAnswer(' + i + ')">' +
                        String.fromCharCode(65 + i) + '. ' + q.options[i] + '</button>';
            }}
            html += '<div class="quiz-explain" id="quiz-explain">' + q.explain + '</div>';

            container.innerHTML = html;
        }}

        function selectAnswer(idx) {{
            var q = quizData[currentQuestion];
            var options = document.querySelectorAll('.quiz-option');

            options.forEach(function(o) {{ o.classList.add('disabled'); }});

            if (idx === q.correct) {{
                options[idx].classList.add('correct');
                options[idx].innerHTML = '✅ ' + options[idx].innerHTML;
                correctCount++;
            }} else {{
                options[idx].classList.add('wrong');
                options[idx].innerHTML = '❌ ' + options[idx].innerHTML;
                options[q.correct].classList.add('correct');
                options[q.correct].innerHTML = '✅ ' + options[q.correct].innerHTML;
            }}

            document.getElementById('quiz-explain').classList.add('show');
            attempts++;

            setTimeout(function() {{
                currentQuestion++;
                renderQuestion();
            }}, 2500);
        }}

        function showQuizResult() {{
            var pct = Math.round((correctCount / totalQuestions) * 100);
            var passed = correctCount === totalQuestions;

            var container = document.getElementById('quiz-container');
            container.style.display = 'none';

            var result = document.getElementById('quiz-result');
            result.style.display = 'block';

            if (passed) {{
                result.innerHTML =
                    '<div class="score-circle pass">' + pct + '%<div class="score-label">Score</div></div>' +
                    '<h2 style="color:#22c55e; margin-bottom:8px;">All Correct! 🎉</h2>' +
                    '<p>Excellent work! You understand the key phishing indicators.</p>' +
                    '<div class="btn-center"><button class="btn btn-success" onclick="completeQuiz()">Continue →</button></div>';
            }} else {{
                result.innerHTML =
                    '<div class="score-circle fail">' + pct + '%<div class="score-label">Score</div></div>' +
                    '<h2 style="color:#ef4444; margin-bottom:8px;">Not Quite — Try Again</h2>' +
                    '<p>You got ' + correctCount + ' out of ' + totalQuestions + ' correct. You need 100% to proceed.</p>' +
                    '<div class="btn-center"><button class="btn btn-warning" onclick="retryQuiz()">Retry Quiz →</button></div>';
            }}
        }}

        function retryQuiz() {{
            currentQuestion = 0;
            correctCount = 0;
            var container = document.getElementById('quiz-container');
            container.style.display = 'block';
            document.getElementById('quiz-result').style.display = 'none';
            renderQuestion();
        }}

        function completeQuiz() {{
            // Update score card
            var scoreCard = document.getElementById('score-card');
            scoreCard.innerHTML =
                '<div class="score-circle pass" style="width:100px;height:100px;font-size:28px;">100%</div>' +
                '<p><strong>Quiz Score:</strong> {len(quiz)}/{len(quiz)} correct</p>' +
                '<p><strong>Attack Type:</strong> {scenario_display}</p>' +
                '<p style="color:#22c55e; font-weight:600;">✓ Micro-training recorded successfully</p>';

            goToStep(4);
        }}
    </script>
</body>
</html>"""


def generate_mandatory_training_page(
    user_id: str,
    complete_url: str,
) -> str:
    """Generate an interactive mandatory training page with quiz."""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Mandatory Security Training</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
            color: #e2e8f0; min-height: 100vh;
        }}
        .container {{ max-width: 720px; margin: 0 auto; padding: 24px 20px; }}
        .card {{
            background: rgba(30, 41, 59, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 16px; padding: 32px; margin-bottom: 20px;
        }}
        h2 {{
            font-size: 20px; margin-bottom: 16px;
            background: linear-gradient(90deg, #f59e0b, #d97706);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }}
        h3 {{ color: #94a3b8; font-size: 14px; text-transform: uppercase;
             letter-spacing: 1px; margin-bottom: 12px; }}
        p {{ line-height: 1.7; color: #94a3b8; }}
        .progress-bar {{ display: flex; gap: 8px; margin-bottom: 32px; }}
        .progress-step {{ flex: 1; height: 6px; border-radius: 3px; background: #334155; transition: background 0.4s; }}
        .progress-step.active {{ background: linear-gradient(90deg, #f59e0b, #d97706); }}
        .progress-step.done {{ background: #22c55e; }}
        .step {{ display: none; animation: fadeInUp 0.5s ease; }}
        .step.active {{ display: block; }}
        @keyframes fadeInUp {{ from {{ opacity: 0; transform: translateY(20px); }} to {{ opacity: 1; transform: translateY(0); }} }}

        .module {{ padding: 20px; margin-bottom: 16px; border-radius: 12px; background: rgba(51, 65, 85, 0.4); border: 1px solid rgba(148, 163, 184, 0.1); }}
        .module h4 {{ color: #e2e8f0; font-size: 16px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }}
        .module p {{ font-size: 14px; }}
        .module ul {{ padding-left: 20px; margin-top: 8px; }}
        .module li {{ color: #94a3b8; font-size: 14px; line-height: 1.8; }}

        .quiz-option {{
            display: block; width: 100%; padding: 14px 18px; background: rgba(51, 65, 85, 0.5);
            border: 2px solid #334155; border-radius: 10px; color: #e2e8f0; font-size: 15px;
            cursor: pointer; margin-bottom: 10px; transition: all 0.2s; text-align: left;
        }}
        .quiz-option:hover:not(.disabled) {{ border-color: #f59e0b; background: rgba(245, 158, 11, 0.1); transform: translateX(4px); }}
        .quiz-option.correct {{ border-color: #22c55e; background: rgba(34, 197, 94, 0.15); }}
        .quiz-option.wrong {{ border-color: #ef4444; background: rgba(239, 68, 68, 0.1); }}
        .quiz-option.disabled {{ cursor: default; opacity: 0.6; }}
        .quiz-explain {{ display: none; padding: 14px; background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 10px; color: #86efac; font-size: 14px; line-height: 1.5; margin: 12px 0; }}
        .quiz-explain.show {{ display: block; }}
        .quiz-question {{ font-size: 16px; font-weight: 600; color: #e2e8f0; line-height: 1.5; margin-bottom: 16px; }}
        .quiz-counter {{ color: #64748b; font-size: 13px; margin-bottom: 8px; }}

        .btn {{
            display: inline-flex; align-items: center; gap: 8px; padding: 14px 32px;
            border: none; border-radius: 10px; font-size: 16px; font-weight: 600;
            cursor: pointer; text-decoration: none; transition: all 0.2s;
        }}
        .btn:hover {{ transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }}
        .btn-warning {{ background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; }}
        .btn-success {{ background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; }}
        .btn-center {{ display: flex; justify-content: center; margin-top: 24px; }}

        .trophy {{ font-size: 72px; margin-bottom: 16px; animation: bounce 1s ease; text-align: center; }}
        @keyframes bounce {{ 0%, 100% {{ transform: translateY(0); }} 50% {{ transform: translateY(-20px); }} }}
    </style>
</head>
<body>
    <div class="container">
        <div class="progress-bar">
            <div class="progress-step active" id="mprog1"></div>
            <div class="progress-step" id="mprog2"></div>
            <div class="progress-step" id="mprog3"></div>
        </div>

        <!-- Step 1: Training Modules -->
        <div class="step active" id="mstep1">
            <div class="card">
                <h2>📚 Mandatory Security Awareness Training</h2>
                <p>Complete all training modules below and pass the final assessment to achieve <strong style="color:#22c55e">COMPLIANT</strong> status.</p>
            </div>

            <div class="card">
                <div class="module">
                    <h4>📧 Module 1: Phishing Recognition</h4>
                    <p>Learn to identify phishing emails before they cause harm:</p>
                    <ul>
                        <li><strong>Sender verification:</strong> Check the full email address, not just the display name</li>
                        <li><strong>Link inspection:</strong> Hover over links to preview URLs before clicking</li>
                        <li><strong>Urgency red flags:</strong> Legitimate requests rarely have extreme deadlines</li>
                        <li><strong>Grammar/formatting:</strong> Look for subtle errors that indicate a non-professional sender</li>
                        <li><strong>Unexpected attachments:</strong> Never open unexpected files, even from known senders</li>
                    </ul>
                </div>
                <div class="module">
                    <h4>🔑 Module 2: Password & Authentication Security</h4>
                    <p>Protect your credentials from theft:</p>
                    <ul>
                        <li><strong>Unique passwords:</strong> Never reuse passwords across services</li>
                        <li><strong>Password managers:</strong> Use tools like 1Password, Bitwarden, or LastPass</li>
                        <li><strong>Enable MFA:</strong> Multi-factor authentication blocks 99.9% of automated attacks</li>
                        <li><strong>Never share credentials:</strong> IT will never ask for your password via email</li>
                        <li><strong>Report compromises:</strong> If you suspect credential theft, change passwords immediately</li>
                    </ul>
                </div>
                <div class="module">
                    <h4>🛡️ Module 3: Incident Response</h4>
                    <p>What to do when something goes wrong:</p>
                    <ul>
                        <li><strong>Report immediately:</strong> Contact IT Security within minutes of a suspected incident</li>
                        <li><strong>Don't panic:</strong> Early reporting significantly reduces damage</li>
                        <li><strong>Document what happened:</strong> Note what you clicked, when, and what you saw</li>
                        <li><strong>Change passwords:</strong> Update credentials for any affected accounts</li>
                        <li><strong>Disconnect if needed:</strong> If you suspect malware, disconnect from the network</li>
                    </ul>
                </div>
            </div>
            <div class="btn-center">
                <button class="btn btn-warning" onclick="mGoToStep(2)">Take Final Assessment →</button>
            </div>
        </div>

        <!-- Step 2: Assessment -->
        <div class="step" id="mstep2">
            <div class="card">
                <h2>📝 Final Assessment</h2>
                <p>Answer all questions correctly to achieve compliance. You must score 100%.</p>
                <div id="m-quiz-container"></div>
                <div id="m-quiz-result" style="display:none; text-align:center; margin-top:20px;"></div>
            </div>
        </div>

        <!-- Step 3: Completion -->
        <div class="step" id="mstep3">
            <div class="card" style="text-align:center; padding:48px;">
                <div class="trophy">🏆</div>
                <h1 style="color:#34d399; font-size:28px; margin-bottom:8px;">Fully Compliant!</h1>
                <p style="font-size:16px;">You've completed all security awareness training modules and passed the assessment.</p>
                <div style="display:inline-block; padding:10px 24px; background:#059669; color:#fff; border-radius:24px; font-weight:700; margin-top:20px;">✓ Security Training Complete</div>
                <div class="btn-center" style="margin-top:24px;">
                    <a class="btn btn-success" href="{complete_url}" style="text-decoration:none;">
                        ✓ Confirm & Update Status to Compliant
                    </a>
                </div>
            </div>
        </div>
    </div>

    <script>
        var mQuizData = [
            {{
                "q": "You receive an email from your 'CEO' requesting an urgent wire transfer. What should you do?",
                "options": [
                    "Process it immediately to avoid upsetting leadership",
                    "Verify the request by calling the CEO's known phone number directly",
                    "Reply to the email asking for confirmation",
                    "Forward it to your manager via the same email chain"
                ],
                "correct": 1,
                "explain": "Business Email Compromise (BEC) is a $2.7B/year problem. Always verify financial requests through a separate, trusted communication channel."
            }},
            {{
                "q": "What is the most effective protection against credential theft?",
                "options": [
                    "Using a strong, unique password",
                    "Changing passwords monthly",
                    "Enabling Multi-Factor Authentication (MFA)",
                    "Using a VPN"
                ],
                "correct": 2,
                "explain": "MFA blocks 99.9% of automated credential attacks. Even if your password is stolen, the attacker can't access your account without the second factor."
            }},
            {{
                "q": "You accidentally clicked a suspicious link and a page loaded. What should you do FIRST?",
                "options": [
                    "Close the browser and hope nothing happened",
                    "Report the incident to IT Security immediately",
                    "Run a virus scan later tonight",
                    "Ask a colleague if they got the same email"
                ],
                "correct": 1,
                "explain": "Speed is critical in incident response. Report immediately — IT Security can contain the threat much more effectively when notified quickly."
            }},
            {{
                "q": "Which of the following is NOT a common phishing technique?",
                "options": [
                    "Creating urgency ('account will be suspended in 1 hour')",
                    "Impersonating a trusted brand or colleague",
                    "Sending from an email ending in the company's official domain",
                    "Using fear to bypass rational thinking"
                ],
                "correct": 2,
                "explain": "Phishing uses look-alike domains (e.g., company-verify.com), not actual company domains. If an email comes from the real domain, it's less likely (but not impossible) to be phishing."
            }}
        ];

        var mCurrentQ = 0;
        var mCorrect = 0;
        var mTotal = mQuizData.length;

        function mGoToStep(n) {{
            document.querySelectorAll('.step').forEach(function(s) {{ s.classList.remove('active'); }});
            document.getElementById('mstep' + n).classList.add('active');
            for (var i = 1; i <= 3; i++) {{
                var el = document.getElementById('mprog' + i);
                el.classList.remove('active', 'done');
                if (i < n) el.classList.add('done');
                if (i === n) el.classList.add('active');
            }}
            window.scrollTo({{ top: 0, behavior: 'smooth' }});
            if (n === 2) mRenderQuestion();
        }}

        function mRenderQuestion() {{
            var container = document.getElementById('m-quiz-container');
            if (mCurrentQ >= mTotal) {{
                mShowResult();
                return;
            }}
            var q = mQuizData[mCurrentQ];
            var html = '<div class="quiz-counter">Question ' + (mCurrentQ + 1) + ' of ' + mTotal + '</div>';
            html += '<div class="quiz-question">' + q.q + '</div>';
            for (var i = 0; i < q.options.length; i++) {{
                html += '<button class="quiz-option" onclick="mSelectAnswer(' + i + ')">' +
                        String.fromCharCode(65 + i) + '. ' + q.options[i] + '</button>';
            }}
            html += '<div class="quiz-explain" id="m-quiz-explain">' + q.explain + '</div>';
            container.innerHTML = html;
        }}

        function mSelectAnswer(idx) {{
            var q = mQuizData[mCurrentQ];
            var options = document.querySelectorAll('#mstep2 .quiz-option');
            options.forEach(function(o) {{ o.classList.add('disabled'); }});
            if (idx === q.correct) {{
                options[idx].classList.add('correct');
                options[idx].innerHTML = '✅ ' + options[idx].innerHTML;
                mCorrect++;
            }} else {{
                options[idx].classList.add('wrong');
                options[idx].innerHTML = '❌ ' + options[idx].innerHTML;
                options[q.correct].classList.add('correct');
                options[q.correct].innerHTML = '✅ ' + options[q.correct].innerHTML;
            }}
            document.getElementById('m-quiz-explain').classList.add('show');
            setTimeout(function() {{ mCurrentQ++; mRenderQuestion(); }}, 2500);
        }}

        function mShowResult() {{
            var pct = Math.round((mCorrect / mTotal) * 100);
            document.getElementById('m-quiz-container').style.display = 'none';
            var result = document.getElementById('m-quiz-result');
            result.style.display = 'block';
            if (mCorrect === mTotal) {{
                result.innerHTML = '<h2 style="color:#22c55e;">Assessment Passed! 🎉</h2>' +
                    '<p>Score: ' + pct + '% — You answered all questions correctly.</p>' +
                    '<div class="btn-center"><button class="btn btn-success" onclick="mGoToStep(3)">Complete Training →</button></div>';
            }} else {{
                result.innerHTML = '<h2 style="color:#ef4444;">Not Quite — Try Again</h2>' +
                    '<p>Score: ' + pct + '% (' + mCorrect + '/' + mTotal + ' correct). You need 100% to pass.</p>' +
                    '<div class="btn-center"><button class="btn btn-warning" onclick="mRetry()">Retry Assessment →</button></div>';
            }}
        }}

        function mRetry() {{
            mCurrentQ = 0; mCorrect = 0;
            document.getElementById('m-quiz-container').style.display = 'block';
            document.getElementById('m-quiz-result').style.display = 'none';
            mRenderQuestion();
        }}
    </script>
</body>
</html>"""


def generate_compliance_page(user_id: str) -> str:
    """Generate the final compliance confirmation page."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Fully Compliant</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
            color: #e2e8f0; min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
        }}
        .card {{
            background: rgba(30, 41, 59, 0.8);
            backdrop-filter: blur(10px);
            border: 2px solid #34d399;
            border-radius: 20px; padding: 56px;
            text-align: center; max-width: 520px;
            animation: fadeIn 0.5s ease;
        }}
        @keyframes fadeIn {{ from {{ opacity: 0; transform: scale(0.95); }} to {{ opacity: 1; transform: scale(1); }} }}
        .trophy {{ font-size: 80px; margin-bottom: 20px; animation: bounce 1s ease; }}
        @keyframes bounce {{ 0%, 100% {{ transform: translateY(0); }} 50% {{ transform: translateY(-20px); }} }}
        h1 {{ color: #34d399; font-size: 30px; margin-bottom: 12px; }}
        p {{ color: #94a3b8; line-height: 1.7; font-size: 16px; }}
        .badge {{
            display: inline-block; padding: 10px 24px;
            background: linear-gradient(135deg, #059669, #047857);
            color: #fff; border-radius: 24px;
            font-weight: 700; margin-top: 20px;
            box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
        }}
        .details {{ margin-top: 20px; padding: 16px; border-radius: 10px; background: rgba(51, 65, 85, 0.4); }}
        .details p {{ font-size: 14px; color: #64748b; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="trophy">🏆</div>
        <h1>You're Fully Compliant!</h1>
        <p>Congratulations! You've completed both micro-training and mandatory security awareness training.
           Your status has been updated to <strong style="color:#22c55e">COMPLIANT</strong>.</p>
        <p>Continue staying vigilant — report any suspicious emails using the "Report Phishing" button.</p>
        <div class="badge">✓ Security Training Complete</div>
        <div class="details">
            <p>User: {user_id} • Status: COMPLIANT • Training Date: {__import__('datetime').datetime.utcnow().strftime('%B %d, %Y')}</p>
        </div>
    </div>
</body>
</html>"""
