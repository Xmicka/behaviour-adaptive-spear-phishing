# Behaviour-Adaptive Spear Phishing System
=================================================

The Behaviour-Adaptive Spear Phishing System is a comprehensive, automated platform designed to improve organizational security posture through continuous behavioral monitoring and targeted security awareness training.

Instead of sending generic phishing simulations to all employees, this system uses a browser extension to silently monitor behavioral indicators (like excessive tab creation, late-night logins, or rapid typing cadence) that often correlate with susceptibility to social engineering. It runs an anomaly detection pipeline to identify high-risk users, and then automatically crafts and delivers highly personalized, context-aware phishing simulations. When a user falls for a simulation, they are immediately guided through contextual micro-training tailored to their specific vulnerability.

## Core Components

1. **Browser Extension (Metadata Collector)**: A Manifest V3 Chrome extension that silently collects non-intrusive behavioral telemetry. It explicitly does *not* capture keystrokes, passwords, or the content of visited pages—only metadata like navigation events, click frequency, and typing pace.
2. **Backend Engine (Python/Flask)**: Receives and stores telemetry, runs the Isolation Forest machine learning pipeline to detect anomalies and compute risk scores, generates adaptive phishing emails via LLM templates, and manages user state.
3. **Admin Dashboard (React/TypeScript)**: A premium, real-time visualization interface for security administrators to monitor organizational risk, review individual employee behavior, manually trigger simulations, and track training compliance.

## Quick Start (Local Development)

### Option 1: Run Full Demo (Recommended)

The quickest way to see the system in action with 10 demo employees and a complete behavioral pipeline:

```bash
# Load demo data, run anomaly detection, and trigger phishing emails
bash run_demo.sh

# In separate terminals:
python -m backend.api_server           # Backend (port 8000)
cd frontend && npm run dev             # Frontend (port 5173)

# Open http://localhost:5173 to view the dashboard
```

This automatically:
- Loads 10 demo employees with 2 flagged as high-risk
- Processes 60 behavioral events across 6 days
- Runs ML anomaly detection (Isolation Forest)
- Computes risk scores and auto-triggers 2 phishing emails
- Persists all results in `backend/data/`

For detailed demo documentation, see [DEMO_SETUP.md](DEMO_SETUP.md) and [README_DEMO.md](README_DEMO.md).

### Option 2: Manual Setup

#### 1. Backend Setup

The backend requires Python 3.10+ and uses SQLite for local event storage.

```bash
# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask API server (runs on port 8000)
python -m backend.api_server
```

#### 2. Frontend Setup

The frontend is a React application built with Vite and Tailwind CSS.

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server (runs on port 5173)
npm run dev
```

#### 3. Extension Installation

To test the end-to-end data flow, install the extension locally:

1. In Chrome, navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked** and select the `extension/` directory.
4. Click the newly added extension icon to open the Onboarding Popup.
5. Register a test employee. This creates an entry in the backend database and links the extension to that ID.

## Key Features

### Behavioral Intelligence
- Real-time monitoring of non-intrusive behavioral signals (tab creation, login patterns, typing cadence)
- No keystrokes, passwords, or page content captured
- Event-driven architecture with automatic anomaly detection

### Machine Learning Pipeline
- **Isolation Forest Algorithm**: Detects statistical anomalies in user behavior
- **Risk Scoring**: Blended scoring combining ML anomaly scores with rule-based features (0.0-1.0 scale)
- **Auto-Triggering**: Automatically generates and sends phishing emails for high-risk users

### Adaptive Phishing Generation
- **LLM Integration**: Optional Gemini API for dynamic, context-aware email generation
- **Fallback Templates**: 15+ pre-built phishing templates for offline operation
- **Behavioral Signals**: Incorporates detected anomalies and user patterns into email content
- **Role-Based Customization**: Different email strategies for finance, HR, engineering, executives, and general staff
- **Tracking Support**: Automatic injection of tracking pixels and links

### Admin Dashboard
- Real-time monitoring of organizational risk posture
- Individual user behavior visualization
- Manual campaign generation and triggering
- Email preview with behavioral explanations
- Training compliance tracking

## Demo Environment

A complete demo setup is included with:
- 10 sample employees with varying risk profiles
- 60 behavioral events spanning 6 days with 2 injected anomalies
- Pre-configured pipeline that detects 100% of anomalies with 0% false positives
- Auto-trigger phishing emails for high-risk users

Run `bash run_demo.sh` to execute the complete demo pipeline in 3 phases:
1. Load demo employees and behavioral logs
2. Run anomaly detection and compute risk scores  
3. Auto-trigger personalized phishing emails

See [README_DEMO.md](README_DEMO.md) for comprehensive demo documentation.

## Core Workflows

For a detailed breakdown of how data moves through the system, please refer to [SYSTEM_WORKFLOWS.md](SYSTEM_WORKFLOWS.md).

Key workflows include:
- **Continuous Telemetry Gathering**: The extension batches behavioral events and POSTs them to `/api/collect`.
- **Suspicious Activity Warnings**: The backend monitors for immediate anomalies (e.g., rapid tab creation) and automatically fires warning emails to the affected user.
- **Autonomous Pipeline**: An isolation forest algorithm runs over the collected events, calculating risk scores and automatically triggering phishing simulations for users crossing the threshold.
- **Adaptive Manual Generation**: Admins can select users and scenarios, generate emails tailored to their behavior via LLM or templates, review a detailed preview of exactly why the email was written that way, and immediately dispatch it.
- **Remediation**: When a simulation link is clicked, the user is navigated to a dynamic training landing page demanding completion of a micro-quiz.

## Security & Privacy Considerations

This system processes sensitive data and is categorized as a security tool. The following constraints are enforced:

*   **Privacy by Design**: The browser extension only captures telemetry metadata. It does not record keystrokes or scrape page content.
*   **CORS Hardening**: The backend restricts cross-origin requests exclusively to configured dashboard domains and the `chrome-extension://` scheme.
*   **Email Cooldowns**: Automated warning emails initiated by suspicious behavior triggers are rate-limited to prevent inbox flooding.
*   **Input Validation**: All POST endpoints enforce payload size limits (typically 50-100KB) to prevent resource exhaustion attacks.

## Extensibility

This repository serves as a foundation for adaptive security awareness. Future extensions could include:
- Integration with Active Directory (AD) for automated employee onboarding and de-provisioning.
- Expanded ML models analyzing different behavior vectors (e.g., email sentiment analysis, building access logs).
- Webhook integrations to alert SIEM systems (like Splunk or Datadog) when critical anomalies are detected.

## Documentation

Comprehensive documentation is available:

- **[DEMO_SETUP.md](DEMO_SETUP.md)** - Complete demo environment setup guide with all 10 employees, 60 events, and detailed pipeline explanation
- **[README_DEMO.md](README_DEMO.md)** - Quick start guide, expected results, and demo workflow
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical breakdown of all 8 implemented features with code examples
- **[SYSTEM_WORKFLOWS.md](SYSTEM_WORKFLOWS.md)** - Detailed data flow and system architecture
- **[demo.json](demo.json)** - Quick reference with structured metadata

## Project Structure

```
├── backend/
│   ├── api_server.py                    # Flask REST API
│   ├── data/
│   │   ├── employees.json               # Demo employee data
│   │   ├── behavior_logs.json           # Demo behavioral events
│   │   └── *.csv, *.db                  # Generated outputs
│   ├── mailer/
│   │   ├── gemini_generator.py          # LLM-based email generation
│   │   ├── email_sender.py              # Email delivery
│   │   └── email_templates.py           # Default templates
│   ├── models/
│   │   └── isolation_forest.py          # ML anomaly detection
│   ├── pipeline/
│   │   └── run_pipeline.py              # Feature extraction & scoring
│   └── scripts/
│       ├── load_demo_data.py            # Demo data loader
│       └── run_demo_pipeline.py         # Full demo orchestration
├── frontend/
│   ├── src/
│   │   ├── api/client.ts                # API client with Gemini support
│   │   ├── dashboard/                   # Admin dashboard components
│   │   ├── components/                  # Reusable UI components
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   └── js/                              # Service worker & content scripts
├── run_demo.sh                          # One-command demo launcher
└── README.md                            # This file
```
