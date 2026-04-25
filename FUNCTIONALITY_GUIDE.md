# Complete Functionality Guide - Behaviour-Adaptive Spear Phishing System

**All functionalities with exact file locations and line numbers**

---

## 📊 **1. RISK SCORING & ANOMALY DETECTION**

### 1.1 Isolation Forest ML Model
**File:** [`backend/models/isolation_forest.py`](backend/models/isolation_forest.py)  
**Lines:** 1-102  
**What it does:**
- Trains unsupervised anomaly detection model on behavioral features
- Computes anomaly scores (higher = more suspicious)
- Returns normalized scores for risk blending

**Key functions:**
- `run_isolation_forest(features: pd.DataFrame)` → Lines 27-102
  - Input: 9 behavioral features per user
  - Output: DataFrame with `anomaly_score` column (0-1)
  - Uses scikit-learn IsolationForest with 100 trees, 5% contamination

---

### 1.2 Risk Score Computation (50% ML + 50% Rules)
**File:** [`backend/scoring/risk_score.py`](backend/scoring/risk_score.py)  
**Lines:** 1-170  
**What it does:**
- Blends ML anomaly score with rule-based heuristics
- Generates explainable risk reasons
- Normalizes scores to 0.0-1.0 scale

**Key functions:**
- `_minmax_series(s: pd.Series)` → Lines 5-23
  - Normalizes individual features to [0, 1] defensively
  
- `compute_risk_score(df, rule_based_score, ml_anomaly_score)` → Lines 26-170
  - **Rules breakdown (lines 115-135):**
    - 0.1 × failed_login_ratio
    - 0.1 × login_count
    - 0.05 × unique_src_hosts
    - 0.05 × unique_dst_hosts
    - **0.2 × tab_burst_count** (high weight)
    - **0.2 × unusual_hours** (high weight)
    - **0.3 × phishing_clicks** (highest weight)
  - Final score = 0.5 × ML + 0.5 × Rules (line 141)
  - Generates `risk_reason` explanations (lines 152-170)

---

### 1.3 Feature Extraction from Behavioral Events
**File:** [`backend/features/feature_extractor.py`](backend/features/feature_extractor.py)  
**Lines:** 1-254  
**What it does:**
- Converts raw behavioral events into 9 ML-ready features
- Handles edge cases defensively
- Validates input data

**Key functions:**
- `load_authentication_data(path_or_buffer)` → Lines 70-131
  - Loads CSV/behavioral data
  - Validates required columns
  - Parses timestamps and success flags
  
- `extract_user_features(df)` → Lines 134-210
  - Aggregates events by user
  - Outputs 9 features:
    - `login_count` (total logins)
    - `failed_login_ratio` (failed / total)
    - `unique_src_hosts` (IP diversity)
    - `unique_dst_hosts` (server diversity)
    - `tab_burst_count` (rapid tab opens)
    - `unusual_hours_login` (logins outside 7 AM - 10 PM)
    - `page_view_count` (total pages)
    - `click_count` (total clicks)
    - `total_events` (total events)

---

### 1.4 Training Decision Logic (Thresholds)
**File:** [`backend/training/training_decision.py`](backend/training/training_decision.py)  
**Lines:** 1-122  
**What it does:**
- Maps risk scores to training actions
- Generates decision thresholds

**Key functions:**
- `decide_training_actions(df)` → Lines 69-122
  - **Threshold logic (lines 94-105):**
    - risk_score < 0.3 → NONE (no action)
    - 0.3 ≤ risk_score < 0.6 → MICRO (short training)
    - risk_score ≥ 0.6 → MANDATORY (full training + phishing)

---

## 🔄 **2. ML PIPELINE ORCHESTRATION**

### 2.1 Main Pipeline Runner
**File:** [`backend/pipeline/run_pipeline.py`](backend/pipeline/run_pipeline.py)  
**Lines:** 1-92  
**What it does:**
- Orchestrates: Load → Extract → Anomaly Detect → Risk Score → Save

**Flow (lines 16-92):**
1. Load telemetry from EventStore (line 22)
2. Extract features (line 27)
3. Run Isolation Forest (line 31)
4. Compute risk scores (line 36)
5. Save to CSV (line 45)
6. Record to database (line 41)

---

### 2.2 Automatic Scheduler
**File:** [`backend/scheduler.py`](backend/scheduler.py)  
**Lines:** 1-238  
**What it does:**
- Auto-runs pipeline every 6 hours
- Triggers phishing emails for high-risk users
- Manages background jobs

**Key functions:**
- `start_scheduler()` → Lines 44-70
  - Runs pipeline job (trigger: every 6 hours)
  - Auto-triggers phishing for risk_score ≥ 0.6

- `get_scheduler_status()` → Lines 90-110
  - Returns scheduler health/stats

---

## 📧 **3. EMAIL GENERATION & PHISHING**

### 3.1 Dynamic Email Template Engine (NO FIXED TEMPLATES!)
**File:** [`backend/mailer/email_templates.py`](backend/mailer/email_templates.py)  
**Lines:** 1-628  
**What it does:**
- Generates **unique** phishing emails from user behavior
- Infers attack vectors from browsing patterns
- Adapts content based on risk score and interaction style

**Key sections:**

**Attack Vector Inference (lines 28-89):**
- `_infer_attack_vector(pages_visited, domains)` → Lines 57-89
  - Maps keywords to attack types:
    - "bank" → financial_phishing
    - "hr" → hr_internal
    - "admin" → admin_access
    - "login" → credential_harvest
    - etc.

**Sender Identity Generator (lines 92-156):**
- `_pick_sender(attack_vector, user_domains)` → Lines 142-156
  - Spoofs credible internal senders
  - Uses user's real domains to increase believability

**Subject Line Generator (lines 159-213):**
- `_generate_subject(attack_vector, display_name, risk_score, signals)` → Lines 169-213
  - Context-aware subjects based on user behavior
  - Adds urgency prefixes for high-risk users (risk_score ≥ 0.65)

**Pretext Generator (lines 216-280):**
- `_generate_pretext(attack_vector, display_name, signals, risk_score)` → Lines 226-280
  - References user's actual behaviors
  - Tailors text to inferred vulnerability

**HTML Email Builder (lines 283-390):**
- `_build_html_email(...)` → Lines 293-390
  - Professional HTML formatting
  - Dynamic urgency banners for high-risk users
  - Extra click surfaces for heavy clickers
  - Speed optimization notes for fast typists

**Main Entry Point (lines 393-539):**
- `generate_email_content(user_id, risk_score, phishing_link, tracking_pixel_url, scenario, context, behavioral_signals)` → Lines 406-539
  - **Orchestrates entire email generation**
  - Input: User behavior + risk score
  - Output: Subject, HTML body, plain text, sender identity, unique template ID

---

### 3.2 Email Sending via SMTP
**File:** [`backend/mailer/email_sender.py`](backend/mailer/email_sender.py)  
**Lines:** 1-223  
**What it does:**
- Sends emails via SMTP (Gmail default)
- Falls back to log-only mode if no credentials
- Generates tracking tokens and URLs

**Key functions:**
- `_generate_tracking_token()` → Lines 45-46
  - Creates unique UUID for email tracking

- `send_phishing_email(recipient_email, subject, body_html, body_text, tracking_token, sender_name)` → Lines 49-131
  - Sends via SMTP (lines 92-118)
  - Logs result in email_events.db (line 126)
  - Falls back to log-only if SMTP unconfigured

- `generate_tracking_links(user_id, base_url)` → Lines 180-200
  - Creates phishing links with embedded tracking tokens

- `create_tracking_token(user_id, email_id)` → Lines 203-223
  - Generates unique token for link/pixel tracking

---

### 3.3 Email Logging & Event Tracking
**File:** [`backend/mailer/email_logger.py`](backend/mailer/email_logger.py)  
**Lines:** 1-366  
**What it does:**
- Logs all phishing emails sent
- Tracks opens (pixel) and clicks (link)
- Records user engagement

**Key functions:**
- `log_email_sent(email_id, user_id, scenario, tracking_token, ...)` → Lines 80-125
  - Stores email metadata in SQLite
  
- `log_email_open(tracking_token)` → Lines 128-148
  - Records pixel fire (email opened)

- `log_email_click(tracking_token)` → Lines 151-171
  - Records link click (user fell for it)

- `get_email_history(user_id)` → Lines 174-195
  - Retrieves user's phishing email history

---

### 3.4 AI-Powered Email Generation (Optional Gemini API)
**File:** [`backend/mailer/gemini_generator.py`](backend/mailer/gemini_generator.py)  
**Lines:** 1-189  
**What it does:**
- Uses Google Gemini API for LLM-based email customization
- Falls back to template engine if API unavailable
- Generates ultra-personalized content

**Key functions:**
- `generate_with_gemini(user_behavior, risk_score, attack_vector)` → Lines 50-130
  - Calls Gemini API with user context
  - Returns custom email content

---

## 📊 **4. BEHAVIORAL DATA COLLECTION**

### 4.1 Event Store (SQLite Backend)
**File:** [`backend/collector/event_store.py`](backend/collector/event_store.py)  
**Lines:** 1-399  
**What it does:**
- Stores behavioral events from browser extension
- Manages employee registration
- Provides data export for pipeline

**Key functions:**
- `__init__(db_path)` → Lines 38-41
  - Initializes SQLite database
  
- `_ensure_schema()` → Lines 49-114
  - Creates tables:
    - `behavioral_events` (lines 53-65): Stores clicks, tabs, navigation
    - `employees` (lines 67-78): User profiles
    - `risk_history` (lines 103-109): Risk score snapshots
    - `pipeline_runs` (lines 95-101): Pipeline execution logs

- `insert_events(user_id, session_id, events, ip_address, user_agent)` → Lines 119-148
  - Batches and stores behavioral events from extension
  
- `export_to_auth_format()` → Lines 180-210
  - Converts events to feature extraction format
  
- `detect_suspicious_activity(user_id)` → Lines 255-285
  - Detects tab bursts and unusual patterns
  - Triggers warning emails if threshold exceeded

- `register_employee(user_id, name, email, employee_id, device_id)` → Lines 213-235
  - Creates new user record from extension registration

---

### 4.2 Firebase Cloud Sync (Optional)
**File:** [`backend/collector/firestore_sync.py`](backend/collector/firestore_sync.py)  
**Lines:** 1-141  
**What it does:**
- Syncs event data to Firestore for cloud persistence
- Backs up risk scores
- Enables distributed deployments

**Key functions:**
- `sync_events_to_firestore(events)` → Lines 30-65
  - Sends behavioral events to Firestore
  
- `sync_risk_scores_to_firestore(scores)` → Lines 68-100
  - Backs up risk scores to cloud

---

## 🎓 **5. TRAINING & MICRO-TRAINING**

### 5.1 Training Landing Pages
**File:** [`backend/training/training_pages.py`](backend/training/training_pages.py)  
**Lines:** 1-1078  
**What it does:**
- Generates interactive training pages
- Includes embedded quizzes
- Provides contextual education based on vulnerability

**Key functions:**
- `generate_training_page(user_id, scenario, tracking_token)` → Lines 50-300
  - Creates micro-training quiz (5-10 min)
  - Covers: Email verification, phishing red flags, reporting

- `generate_mandatory_training_page(user_id, risk_tier)` → Lines 303-600
  - Full compliance training (20-30 min)
  - For users with risk_score ≥ 0.6
  - Covers: OSINT, social engineering tactics, security policy

- `generate_compliance_page(user_id)` → Lines 603-800
  - Annual compliance training
  - Policy review and acknowledgment

---

### 5.2 User State Management
**File:** [`backend/training/user_state.py`](backend/training/user_state.py)  
**Lines:** 1-240  
**What it does:**
- Tracks training progress
- Manages state transitions
- Records completion timestamps

**States:**
- `normal` → `phishing_sent` → `phishing_clicked` → `training_required` → `training_completed`

**Key functions:**
- `get_user_state(user_id)` → Lines 60-85
  - Returns current state

- `transition_state(user_id, new_state)` → Lines 88-125
  - Moves user through state machine

- `mark_training_completed(user_id, completion_time)` → Lines 128-155
  - Records training completion

---

## 🌐 **6. BACKEND API SERVER**

### 6.1 Flask API Endpoints (Main Orchestrator)
**File:** [`backend/api_server.py`](backend/api_server.py)  
**Lines:** 1-2129  
**What it does:**
- Exposes REST API for frontend dashboard
- Handles browser extension data collection
- Orchestrates pipeline, email generation, training

**Major endpoints:**

**Employee Management (lines ~400-500):**
- `POST /api/employees/register` - Register new employee from extension
- `GET /api/employees` - List all employees
- `GET /api/employees/{id}` - Get employee details

**Event Collection (lines ~550-650):**
- `POST /api/collect` - Receive behavioral events from extension
- `GET /api/events/{user_id}` - Get user's event history

**Pipeline & Scoring (lines ~700-850):**
- `POST /api/pipeline/run` - Trigger ML pipeline
- `GET /api/risk-scores` - Get all user risk scores
- `GET /api/risk-scores/{user_id}` - Get user's risk score

**Email Generation (lines ~900-1100):**
- `POST /api/generate-email` - Generate phishing email preview
- `POST /api/email/send` - Send phishing email
- `POST /api/emails` - List sent emails

**Training (lines ~1150-1350):**
- `GET /api/training/landing/{token}` - Training quiz page
- `POST /api/training/complete` - Record completion
- `GET /api/training/{user_id}` - Get training status

**Dashboard (lines ~1400-1500):**
- `GET /api/dashboard/stats` - Security stats (high risk count, etc.)
- `GET /api/dashboard/timeline` - Event timeline

**Tracking (lines ~1550-1650):**
- `GET /api/tracking/{token}` - Log email open (pixel)
- `POST /api/tracking/{token}/click` - Log link click

---

## 🖥️ **7. FRONTEND DASHBOARD (React/TypeScript)**

### 7.1 Main Dashboard App
**File:** [`frontend/src/App.tsx`](frontend/src/App.tsx)  
**What it does:**
- Main React router and layout

---

### 7.2 Key Dashboard Components

**Employee Directory (Risk Overview)**
**File:** `frontend/src/pages/Dashboard.tsx` / `EmployeeDirectory.tsx`  
- Lists all employees with risk scores
- Color-coded: Green (<0.3), Yellow (0.3-0.6), Red (≥0.6)
- Quick action buttons (send sim, view details)

**Email Generator**
**File:** `frontend/src/dashboard/EmailGenerator.tsx`  
- Select user → Choose scenario → Preview → Send
- Shows behavioral profile alongside email
- Real-time generation with `/api/generate-email`

**Risk Analytics**
**File:** `frontend/src/components/RiskAnalytics.tsx`  
- Time-series risk score charts
- Phishing click rates
- Training completion tracking
- Distribution of users by risk tier

**Behavior Analytics**
**File:** `frontend/src/dashboard/BehaviorAnalytics.tsx`  
- Per-user feature visualization
- Tab burst events, unusual hours, click patterns
- Correlation matrix showing which behaviors → high risk

**Micro-Training Modal**
**File:** `frontend/src/components/MicroTrainingModal.tsx`  
- Embedded quiz that appears after phishing click
- 5-10 minute interactive training
- Auto-completes and redirects user

---

## 📋 **8. DEMO & TEST DATA**

### 8.1 Demo Data Loader
**File:** [`backend/scripts/load_demo_data.py`](backend/scripts/load_demo_data.py)  
**Lines:** 1-173  
**What it does:**
- Loads 10 demo employees with pre-assigned risk scores
- Inserts 60 behavioral events spanning 6 days

**Data:**
- 2 flagged high-risk users (risk_score ≥ 0.65)
- 8 normal users
- Events include intentional anomalies for testing

---

### 8.2 Synthetic Event Generator
**File:** [`backend/scripts/generate_synthetic_events.py`](backend/scripts/generate_synthetic_events.py)  
**Lines:** 1-243  
**What it does:**
- Creates realistic behavioral events for testing
- Generates anomalies (tab bursts, unusual hours)
- Produces repeatable test data

---

### 8.3 Demo Pipeline Runner
**File:** [`backend/scripts/run_demo_pipeline.py`](backend/scripts/run_demo_pipeline.py)  
**Lines:** 1-302  
**What it does:**
- Orchestrates full demo:
  1. Load demo employees
  2. Generate synthetic events
  3. Run ML pipeline
  4. Auto-trigger 2 phishing emails
  5. Display results

---

## ⚙️ **9. CONFIGURATION & CONSTANTS**

### 9.1 Global Configuration
**File:** [`backend/config.py`](backend/config.py)  
**Lines:** 1-119  
**What it does:**
- Centralizes all config (paths, thresholds, API keys)
- Loads from environment variables with defaults

**Key settings:**

```python
# ML Thresholds
IF_CONTAMINATION = 0.05                    # Line 23: 5% contamination for IF
IF_RANDOM_STATE = 42                       # Line 24: Reproducibility seed

# Risk Thresholds
RISK_THRESHOLD_EMAIL = 0.5                 # Line 58: Auto-trigger phishing at 0.5

# Anomaly Detection
ANOMALY_TAB_THRESHOLD = 30                 # Line 62: Tab burst detection
WARNING_EMAIL_COOLDOWN_MINUTES = 60        # Line 63: Don't spam warnings

# SMTP Configuration (lines 45-52)
SMTP_EMAIL = os.environ.get("SMTP_EMAIL")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
```

---

## 🔌 **10. BROWSER EXTENSION**

### 10.1 Extension Manifest & Config
**File:** [`extension/manifest.json`](extension/manifest.json)  
**What it does:**
- Manifest V3 configuration
- Declares permissions (DOM access, storage, messaging)

**File:** [`extension/js/config.js`](extension/js/config.js)  
**What it does:**
- Extension configuration (API endpoint, thresholds)

---

### 10.2 Content Script (Event Collection)
**File:** [`extension/js/content.js`](extension/js/content.js)  
**What it does:**
- Observes DOM events (clicks, navigation)
- Tracks typing cadence
- Detects tab bursts
- Sends events to service worker

---

### 10.3 Service Worker (Batching & Dispatch)
**File:** [`extension/js/service-worker.js`](extension/js/service-worker.js)  
**What it does:**
- Batches events
- Flushes to backend every 30s or on trigger
- Handles tab burst alerts
- Manages extension state

---

### 10.4 Popup UI
**File:** [`extension/popup.html`](extension/popup.html)  
**What it does:**
- Employee onboarding form
- Status display
- Simple settings UI

**File:** [`extension/js/popup.js`](extension/js/popup.js)  
**What it does:**
- Handles popup interactions
- Registers employee with backend

---

## 📊 **11. UTILITY MODULES**

### 11.1 Event Statistics
**EventStore methods (event_store.py, lines 290-350):**
- `get_event_stats()` - Total events, users, recent activity
- `get_user_events(user_id)` - Per-user event history
- `get_feature_distribution()` - Statistics on computed features

---

### 11.2 Error Handling & Logging
Throughout codebase:
- Defensive validation on CSV loads
- Clear ValueError messages for debugging
- Logging at INFO/WARNING/ERROR levels

---

## 📁 **12. DATA FILES & OUTPUTS**

### 12.1 Demo Data
- `backend/data/employees.json` - 10 demo users
- `backend/data/behavior_logs.json` - 60 behavioral events
- `backend/data/phishing_events.json` - Sent emails log

### 12.2 Pipeline Outputs
- `backend/data/final_risk_scores.csv` - Risk scores per user (columns: user, login_count, failed_login_ratio, ..., final_risk_score, risk_reason)
- `backend/data/behavioral_events.db` - SQLite database with all events
- `backend/data/email_events.db` - SQLite database tracking opens/clicks

---

## 🎯 **QUICK REFERENCE: WHERE TO FIND EACH FEATURE**

| Feature | File | Lines |
|---------|------|-------|
| **Risk Scoring** | `backend/scoring/risk_score.py` | 26-170 |
| **ML Anomaly Detection** | `backend/models/isolation_forest.py` | 27-102 |
| **Feature Extraction** | `backend/features/feature_extractor.py` | 134-210 |
| **Training Decision Logic** | `backend/training/training_decision.py` | 69-122 |
| **Pipeline Orchestration** | `backend/pipeline/run_pipeline.py` | 16-92 |
| **Email Generation (Dynamic)** | `backend/mailer/email_templates.py` | 406-539 |
| **Email Sending (SMTP)** | `backend/mailer/email_sender.py` | 49-131 |
| **Email Tracking** | `backend/mailer/email_logger.py` | 80-195 |
| **Event Storage** | `backend/collector/event_store.py` | 119-285 |
| **Auto-Scheduler** | `backend/scheduler.py` | 44-70 |
| **Training Pages** | `backend/training/training_pages.py` | 50-800 |
| **User State Machine** | `backend/training/user_state.py` | 60-155 |
| **API Endpoints** | `backend/api_server.py` | 1-2129 |
| **Configuration** | `backend/config.py` | 1-119 |
| **Data Loader** | `backend/scripts/load_demo_data.py` | 1-173 |
| **Synthetic Events** | `backend/scripts/generate_synthetic_events.py` | 1-243 |
| **Demo Pipeline** | `backend/scripts/run_demo_pipeline.py` | 1-302 |

---

## 🚀 **HOW TO NAVIGATE THE CODEBASE**

**Start here for understanding flow:**
1. Risk Scoring → `backend/scoring/risk_score.py`
2. Feature Extraction → `backend/features/feature_extractor.py`
3. ML Model → `backend/models/isolation_forest.py`
4. Pipeline → `backend/pipeline/run_pipeline.py`
5. Email Gen → `backend/mailer/email_templates.py`
6. API → `backend/api_server.py`

**Start here for data:**
1. Event Collection → `backend/collector/event_store.py`
2. Demo Data → `backend/scripts/load_demo_data.py`

**Start here for training:**
1. State Machine → `backend/training/user_state.py`
2. Decision Logic → `backend/training/training_decision.py`
3. Training Pages → `backend/training/training_pages.py`

---
