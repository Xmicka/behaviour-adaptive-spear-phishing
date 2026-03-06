# Behaviour-Adaptive Spear Phishing System
=================================================

The Behaviour-Adaptive Spear Phishing System is a comprehensive, automated platform designed to improve organizational security posture through continuous behavioral monitoring and targeted security awareness training.

Instead of sending generic phishing simulations to all employees, this system uses a browser extension to silently monitor behavioral indicators (like excessive tab creation, late-night logins, or rapid typing cadence) that often correlate with susceptibility to social engineering. It runs an anomaly detection pipeline to identify high-risk users, and then automatically crafts and delivers highly personalized, context-aware phishing simulations. When a user falls for a simulation, they are immediately guided through contextual micro-training tailored to their specific vulnerability.

## Core Components

1. **Browser Extension (Metadata Collector)**: A Manifest V3 Chrome extension that silently collects non-intrusive behavioral telemetry. It explicitly does *not* capture keystrokes, passwords, or the content of visited pages—only metadata like navigation events, click frequency, and typing pace.
2. **Backend Engine (Python/Flask)**: Receives and stores telemetry, runs the Isolation Forest machine learning pipeline to detect anomalies and compute risk scores, generates adaptive phishing emails via LLM templates, and manages user state.
3. **Admin Dashboard (React/TypeScript)**: A premium, real-time visualization interface for security administrators to monitor organizational risk, review individual employee behavior, manually trigger simulations, and track training compliance.

## Quick Start (Local Development)

### 1. Backend Setup

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

### 2. Frontend Setup

The frontend is a React application built with Vite and Tailwind CSS.

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server (runs on port 5173)
npm run dev
```

### 3. Extension Installation

To test the end-to-end data flow, install the extension locally:

1. In Chrome, navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked** and select the `extension/` directory.
4. Click the newly added extension icon to open the Onboarding Popup.
5. Register a test employee. This creates an entry in the backend database and links the extension to that ID.

## Core Workflows

For a detailed breakdown of how data moves through the system, please refer to [SYSTEM_WORKFLOWS.md](SYSTEM_WORKFLOWS.md).

Key workflows include:
- **Continuous Telemetry Gathering**: The extension batches behavioral events and POSTs them to `/api/collect`.
- **Suspicious Activity Warnings**: The backend monitors for immediate anomalies (e.g., rapid tab creation) and automatically fires warning emails to the affected user.
- **Autonomous Pipeline**: An isolation forest algorithm runs over the collected events, calculating risk scores and automatically triggering phishing simulations for users crossing the threshold.
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
