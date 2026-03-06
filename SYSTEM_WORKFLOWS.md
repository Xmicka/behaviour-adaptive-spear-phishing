# Behaviour-Adaptive Spear Phishing System Workflows

This document outlines the core workflows of the adaptive spear phishing system, detailing how data flows from the employee's browser, through the backend anomaly detection pipeline, and finally to the admin dashboard and automated training responses.

## 1. Employee Data Collection Flow
This flow establishes the continuous collection of behavioral telemetry from the employee's browser.

1. **Onboarding**: The admin provides the browser extension ZIP to the employee.
2. **Installation**: The employee installs the extension in Chrome (Developer Mode).
3. **Registration**: The employee clicks the extension icon, fills out the Onboarding form (Name, Email), and submits.
4. **Backend Sync**: The extension sends registration data to `POST /api/employees/register`. The backend stores this in the `employees` table.
5. **Continuous Telemetry**: As the employee browses, the extension's `content.js` observes DOM events (clicks, typing cadence, navigation).
6. **Batching & Flushing**: `service-worker.js` batches these events and periodically (or dynamically upon critical actions) POSTs them to `/api/collect`.
7. **Storage**: The backend stores the raw JSON events in `behavioral_events` (SQLite).

## 2. Suspicious Browser Activity Detection Flow
This flow operates synchronously during data collection to detect immediate anomalies.

1. **Trigger**: An employee rapidly opens/closes multiple tabs or navigates excessively within a short timeframe.
2. **Client-side Flag**: `content.js` tracks tab events. If `TAB_BURST_THRESHOLD` is exceeded within `TAB_BURST_WINDOW_SEC`, it emits an `unusual_browser_activity` event.
3. **Immediate Dispatch**: `service-worker.js` immediately flushes the queue upon receiving this event type.
4. **Backend Validation**: `POST /api/collect` receives the payload and triggers `_event_store.detect_suspicious_activity`.
5. **Warning Dispatch**: If the backend confirms the anomaly and the cooldown period (`WARNING_EMAIL_COOLDOWN_MINUTES`) has passed, it automatically fires a warning email via `send_warning_email`.

## 3. Behavior Analysis Pipeline
This is the core ML pipeline that translates raw telemetry into risk scores.

1. **Trigger**: The admin clicks "Run Pipeline" on the dashboard (or the autonomous scheduler triggers it).
2. **Extraction**: `POST /api/pipeline/run` fetches all raw events from `behavioral_events` and formats them via `_event_store.export_to_auth_format()`.
3. **Feature Engineering**: `extract_user_features()` processes the raw data into behavioral metrics (e.g., login counts, after-hours usage, burst frequency).
4. **Anomaly Scoring**: `run_isolation_forest()` runs the ML model against the extracted features, assigning an anomaly score.
5. **Risk Calculation**: `compute_risk_score()` synthesizes the anomaly score with behavioral heuristics to produce a final `risk_score` (0.0 to 1.0).
6. **Persist**: Scores are saved to `final_risk_scores.csv` and synced to Firestore (if configured).

## 4. Automated Phishing Automation Flow
This flow executes immediately after the behavior analysis pipeline.

1. **Eligibility Check**: The pipeline identifies users whose `final_risk_score` exceeds the `RISK_THRESHOLD_EMAIL` configuration.
2. **Profile Generation**: For eligible users, the backend aggregates their specific risky behaviors (e.g., "rapid clicking", "late-night access").
3. **Content Generation**: The system uses LLMs (if configured) or adaptive templates to craft an email scenario that exploits the identified behavioral weaknesses.
4. **Dispatch**: The email is sent containing a unique tracking token (`phishing_link`).
5. **Logging**: The event is recorded in `email_events.db`.

## 5. Phishing Response & Training Flow
This flow manages user interaction with simulated phishing emails.

1. **Interaction**: The user opens the email (firing a tracking pixel) or clicks the phishing link.
2. **Logging**: The backend registers the "open" or "click" event against the tracking token in `email_events.db`.
3. **Micro-Training**: If the user clicked, the pipeline redirects them to a contextual micro-training landing page (`/api/training/landing/<token>`).
4. **Assessment**: The user must complete the embedded quiz on the landing page.
5. **State Transition**: Upon completing the quiz (`POST /api/training/complete`), the user's state transitions from `training_required` to `micro_training_completed`.

## 6. Manual Dashboard Flows
Admins can bypass automation for targeted intervention via the Premium Dashboard.

### 6.1 Quick Targeted Simulation
1. Admin navigates to the **Employee Directory**.
2. Admin reviews risk scores and clicks "Send Simulation" for a specific employee.
3. Dashboard sends `POST /api/employees/send-simulation`.
4. Backend retrieves the employee's risk score, generates a targeted email, and dispatches it immediately.

### 6.2 Adaptive Email Generator (Generate -> Preview -> Send)
1. Admin navigates to the **Email Generator**.
2. Admin selects a target employee, simulation scenario, and contextual parameters.
3. Admin clicks "Generate Phishing Email".
4. Dashboard sends `POST /api/generate-email` and retrieves the preview alongside behavioral analysis factors used to personalize the email.
5. Admin reviews the email subject, body, and adaptation reasoning.
6. Admin clicks "Send Email", invoking `POST /api/email/send` with the *exact* preview payload, guaranteeing the sent email matches the preview exactly.

### 6.3 Manual Warning Alerts
1. Admin reviews the **Behavior Analytics** chart for an employee.
2. Noting irregular login hours, admin clicks "Send Warning".
3. Dashboard sends `POST /api/alerts/warning-email`.
4. Backend sends a security warning email independent of the simulation workflow.
