# 🚀 Live Demo Guide - Render Deployment

Complete step-by-step guide to run the Behaviour-Adaptive Spear Phishing platform live on Render and perform a full demo.

---

## **Part 1: Deploy to Render (One-Time Setup)**

### Step 1: Connect GitHub to Render
1. Go to [render.com](https://render.com)
2. Sign up / Log in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Select your repository: `behaviour-adaptive-spear-phishing`
5. Click **"Connect"**

### Step 2: Configure Render Service
- **Name**: `adaptive-spear-phishing`
- **Environment**: `Python 3`
- **Build Command**: (auto-filled from render.yaml)
- **Start Command**: (auto-filled from render.yaml)
- **Plan**: Free (or Starter for better performance)

### Step 3: Add Environment Variables
In Render dashboard, go to **Environment**:

```
SMTP_EMAIL=akeshchandrasiri@gmail.com
SMTP_PASSWORD=ffcu dxzz uyyh tmjr
EMAIL_ENABLED=true
PLATFORM_BASE_URL=https://your-app-name.onrender.com
CORS_ALLOWED_ORIGINS=https://your-app-name.onrender.com
RISK_THRESHOLD_EMAIL=0.5
```

**Note**: Replace `your-app-name` with your actual Render service name.

### Step 4: Deploy
Click **"Create Web Service"** and wait for build to complete (~3-5 minutes)

Your app is now live at: `https://your-app-name.onrender.com`

---

## **Part 2: Live Demo Execution (Every Time You Want to Demo)**

### **Step A: Load Demo Data (2 minutes)**

1. **Navigate to your Render app**:
   ```
   https://your-app-name.onrender.com
   ```

2. **Login**:
   - Email: `admin@example.com`
   - Password: `password123` (or your configured credentials)

3. **Go to Settings** (bottom left sidebar):
   - Click **Settings** icon ⚙️

4. **Seed Demo Data**:
   - Click the blue **"📤 Seed Demo Data"** button
   - Wait for message: ✅ "Loaded 60 events for 10 users"
   - This loads the same sample data as your local demo

---

### **Step B: Run the ML Pipeline (2 minutes)**

1. **Go to Dashboard** (sidebar)

2. **Scroll to "Behaviour Monitoring"**:
   - Click **Behaviour Monitoring** in sidebar

3. **Run Pipeline**:
   - Click the blue **"▶️ Run Pipeline"** button
   - Wait for completion (~30 seconds)
   - You'll see: "Pipeline executed successfully: 60 events processed"

---

### **Step C: View Analysis Results (2 minutes)**

Navigate through the dashboard to see:

1. **Security Posture Overview** (top section)
   - Total Users: 10
   - High Risk: 1-2 employees
   - Average Risk: ~0.35

2. **Behavioral Risk Distribution**
   - Safe: ~7-8 users (green)
   - Watchlist: ~1-2 users (yellow)
   - High Risk: 1-2 users (red) - these are your targets

3. **Risk Timeline**
   - Click an employee to see their risk history
   - ML Anomaly Score: Based on behavioral patterns
   - Login anomalies: Rapid tab switching, unusual hours, etc.

---

### **Step D: Generate Phishing Email (3 minutes)**

1. **Go to Email Generator** (sidebar):
   - Click **Email Generator**

2. **Select Target User**:
   - Dropdown: Pick a **High Risk** user (appears at top)
   - Their profile shows: Risk Score, Login Events, ML Anomaly Score

3. **Choose Scenario**:
   - Dropdown: Select one of:
     - "Urgent Action (Wire Transfer/Payroll)"
     - "Security Alert Verification"
     - "Admin Panel Password Reset"
     - etc.

4. **Generate**:
   - Click **"🎯 Generate Phishing Email"**
   - Wait ~5-10 seconds
   - System displays:
     - **Email Preview**: Subject, From, Body text
     - **Adaptation Factors**: Why this specific user is targeted
     - **Behavioral Profile**: Their actual events, typing speed, pages visited
     - **Personalization Depth**: deep/moderate/basic

5. **Send Email** (optional):
   - Click **"📤 Send Email"** to record in database
   - System logs to email_events.db
   - Status: ✅ "Email sent successfully"

---

### **Step E: View Campaigns & Training (2 minutes)**

1. **Phishing Campaigns** (sidebar):
   - View all simulation campaigns
   - See target users, scenarios, send dates

2. **Training Center** (sidebar):
   - Assigned training modules
   - Completion status
   - Training effectiveness metrics

---

### **Step F: Employee Directory (1 minute)**

1. Click **Employees** in sidebar
2. View all 10 users with:
   - Risk tier (High/Medium/Low)
   - Risk percentage
   - Login count
   - Failed login ratio
   - ML anomaly score

---

## **Part 3: Complete Demo Narrative (10 minutes)**

Use this script for a professional demo:

### **Opening (1 min)**
```
"This is the Behaviour-Adaptive Spear Phishing platform. 
It uses machine learning to analyze employee behavior and 
generate personalized phishing emails that adapt to each 
user's actual usage patterns."
```

### **Data Load (1 min)**
```
Point to Settings → Seed Demo Data
"We start with 10 employees and 60 behavioral events. 
The system analyzes login patterns, page visits, typing speed, 
and click behavior to build a risk profile."
```

### **Pipeline Run (1 min)**
```
Point to Behaviour Monitoring → Run Pipeline
"The ML pipeline uses Isolation Forest to detect anomalies. 
It processes all 60 events and identifies 1-2 high-risk 
employees based on unusual behavior."
```

### **Risk Analysis (2 min)**
```
Show Security Posture Overview:
"Here we see 1 High Risk user, ~1-2 Medium Risk, and the rest Safe.
The High Risk employee shows:
- Unusual login times
- Rapid tab switching (anomaly threshold: 30+ tabs in 5 min)
- Clicking on suspicious links
This makes them vulnerable to spear phishing."
```

### **Email Generation (2 min)**
```
Go to Email Generator → Select high risk user → Select scenario
"The system now generates a personalized phishing email 
specifically tailored to this employee's behavior.
Notice the adaptation factors - it uses their actual websites, 
their communication patterns, and their typing speed."

Generate and show:
"The email preview shows how the system adapts:
- Sender name matches their contacts
- Subject references their actual work (payroll, admin tasks)
- Body references their real behavior patterns
- All tracking links are logged for measurement"
```

### **Closing (1 min)**
```
"This demo shows a complete security testing workflow:
1. Behavioral Analysis (ML)
2. Risk Scoring (ML + Rules)
3. Adaptive Attack Generation (LLM + Behavior)
4. Results Tracking & Training

The platform is designed to help organizations test their 
employees' resilience to social engineering while 
automatically assigning training to those who fall for it."
```

---

## **Data You're Using**

**10 Sample Employees:**
- alice.johnson, bob.smith, charlie.brown, diana.prince
- evan.davis, fiona.miller, george.williams, helen.taylor
- isaac.anderson, julia.thomas

**60 Behavioral Events:**
- 6 events per employee
- Login events at various times (including unusual hours)
- Page visits (admin panels, file shares, email)
- Tab switching patterns
- Click behaviors

**Generated Metrics:**
- Risk Scores: 0.0 - 1.0 (0 = safe, 1 = high risk)
- ML Anomaly Score: Isolation Forest output
- Personalization: Based on actual browsing patterns

---

## **Troubleshooting**

### **No employees appear after seeding**
- Refresh the page (Cmd+R)
- Check browser console (F12) for errors
- Verify backend API is running: `https://your-app.onrender.com/api/dashboard`

### **"Seed Demo Data" button doesn't respond**
- Check network tab (F12) - look for 200 status on `/api/seed-demo-data`
- Backend might be cold starting (first request = slow)
- Wait 30 seconds, try again

### **Email generation takes too long (>15 seconds)**
- System timeout: Shows error message
- Backend might be processing
- Try again with a different user/scenario

### **Navigation buttons don't work**
- You should be on the Dashboard page
- Sidebar items scroll to sections
- Use browser back button to return home

### **Database is empty after Render restart**
- Render free tier restarts occasionally
- This is expected - click "Seed Demo Data" again
- Data is ephemeral on free tier (use PostgreSQL for persistence)

---

## **Key Differences: Local vs Render**

| Feature | Local | Render |
|---------|-------|--------|
| URL | http://localhost:5173 | https://your-app.onrender.com |
| API | http://127.0.0.1:8000 | Same domain (automatic) |
| Data Persistence | Permanent (SQLite) | Ephemeral (lost on restart) |
| Demo Data | Auto-loaded on start | Manual seed via button |
| Speed | Fast (~1-3 sec) | Slower cold starts (~5-10 sec) |
| Email Sending | Works with real SMTP | Works with real SMTP |

---

## **Next Steps After Demo**

1. **Create Training Content**:
   - Go to Training Center
   - Assign micro-quizzes to high-risk users
   - Track completion rates

2. **Schedule Campaigns**:
   - Create recurring campaigns
   - Target specific departments
   - Measure improvement over time

3. **Integrate Extension**:
   - Download browser extension (Settings)
   - Deploy to workforce
   - Collect real behavioral data

4. **Monitor Progress**:
   - Check training effectiveness
   - Review simulation click rates
   - Adjust risk thresholds as needed

---

**Demo Ready! 🚀**

For local testing: See README.md for `npm run dev` + `python backend/api_server.py`
