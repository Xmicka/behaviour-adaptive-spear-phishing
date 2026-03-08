#!/usr/bin/env python3
"""
Demo Pipeline Runner for Adaptive Spear Phishing Platform

This script orchestrates the full demo flow:
1. Loads demo employee and behavior data
2. Runs the anomaly detection pipeline
3. Auto-triggers phishing emails for high-risk users
4. Generates phishing_events.json with results

Usage:
  python backend/scripts/run_demo_pipeline.py [--skip-load] [--threshold 0.6]
"""

import json
import logging
import sys
from pathlib import Path
from datetime import datetime
import argparse

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.collector.event_store import EventStore
from backend.config import COLLECTOR_DB_PATH, RISK_THRESHOLD_EMAIL
from backend.mailer.email_logger import EmailLogger
from backend.mailer.email_sender import send_phishing_email, generate_tracking_links, create_tracking_token
from backend.config import EMAIL_DB_PATH

logger = logging.getLogger(__name__)


def load_demo_data():
    """Load demo employees and behavior logs."""
    from backend.scripts.load_demo_data import load_demo_data as load_fn
    logger.info("=" * 60)
    logger.info("STEP 1: Loading Demo Data")
    logger.info("=" * 60)
    success = load_fn(clear_first=False)
    if success:
        logger.info("✓ Demo data loaded successfully")
    else:
        logger.error("✗ Failed to load demo data")
        return False
    return True


def run_pipeline():
    """Run the anomaly detection pipeline."""
    logger.info("\n" + "=" * 60)
    logger.info("STEP 2: Running Anomaly Detection Pipeline")
    logger.info("=" * 60)
    
    try:
        from backend.features.feature_extractor import extract_user_features
        from backend.models.isolation_forest import run_isolation_forest
        from backend.scoring.risk_score import compute_risk_score
        
        store = EventStore(str(COLLECTOR_DB_PATH))
        
        # Export behavioral data in auth format
        auth_df = store.export_to_auth_format()
        if auth_df.empty:
            logger.error("✗ No behavioral events found")
            return None
        
        logger.info(f"Processing {len(auth_df)} events for {auth_df['user'].nunique()} users...")
        
        # Extract features
        features = extract_user_features(auth_df)
        if features.empty:
            logger.error("✗ No features extracted")
            return None
        
        logger.info(f"✓ Extracted features for {len(features)} users")
        
        # Run Isolation Forest
        anomalies = run_isolation_forest(features)
        logger.info("✓ Isolation Forest completed")
        
        # Compute risk scores
        results = compute_risk_score(anomalies)
        
        # Ensure proper format
        if results.index.name is None:
            if "user" in results.columns:
                out_df = results.reset_index(drop=True)
            else:
                out_df = results.reset_index()
        else:
            out_df = results.reset_index()
        
        logger.info(f"✓ Risk scores computed")
        logger.info("\nRisk Score Summary:")
        logger.info("-" * 60)
        
        # Print risk summary
        if "final_risk_score" in out_df.columns:
            high_risk = out_df[out_df["final_risk_score"] >= 0.6]
            medium_risk = out_df[(out_df["final_risk_score"] >= 0.3) & (out_df["final_risk_score"] < 0.6)]
            low_risk = out_df[out_df["final_risk_score"] < 0.3]
            
            logger.info(f"High Risk (≥0.6):    {len(high_risk)} users")
            for _, row in high_risk.iterrows():
                logger.info(f"  - {row.get('user', 'unknown')}: {row.get('final_risk_score', 0):.3f}")
            
            logger.info(f"Medium Risk (0.3-0.6): {len(medium_risk)} users")
            logger.info(f"Low Risk (<0.3):      {len(low_risk)} users")
            logger.info(f"Average Risk Score:   {out_df['final_risk_score'].mean():.3f}")
        
        logger.info("-" * 60)
        
        # Save results
        output_path = Path(__file__).resolve().parent.parent / "data" / "final_risk_scores.csv"
        out_df.to_csv(output_path, index=False)
        logger.info(f"✓ Results saved to {output_path}")
        
        return out_df
        
    except Exception as e:
        logger.error(f"✗ Pipeline failed: {e}", exc_info=True)
        return None


def trigger_phishing_emails(results_df, threshold=None):
    """Auto-trigger phishing emails for high-risk users."""
    logger.info("\n" + "=" * 60)
    logger.info("STEP 3: Triggering Phishing Emails for High-Risk Users")
    logger.info("=" * 60)
    
    if threshold is None:
        threshold = RISK_THRESHOLD_EMAIL
    
    if "final_risk_score" not in results_df.columns:
        logger.error("✗ No risk scores in results")
        return []
    
    store = EventStore(str(COLLECTOR_DB_PATH))
    email_logger = EmailLogger(str(EMAIL_DB_PATH))
    
    high_risk_users = results_df[results_df["final_risk_score"] >= threshold]
    logger.info(f"Found {len(high_risk_users)} users above threshold ({threshold})")
    
    phishing_events = []
    
    for _, row in high_risk_users.iterrows():
        user_id = row.get("user", "unknown")
        risk_score = float(row.get("final_risk_score", 0))
        
        # Get employee details
        emp = store.get_employee(user_id)
        if not emp:
            logger.warning(f"  - {user_id}: Employee not found, skipping")
            continue
        
        recipient_email = emp.get("email", user_id)
        
        # Check pending training
        if email_logger.has_pending_training(user_id):
            logger.info(f"  - {user_id}: Pending training, skipping")
            continue
        
        # Generate tracking token and links
        tracking_token = create_tracking_token()
        links = generate_tracking_links(tracking_token)
        
        # Determine phishing type based on risk
        if risk_score >= 0.8:
            scenario = "credential_harvest"
            subject = f"URGENT: Security Verification Required for {emp.get('name', 'User')}"
            body_text = f"""Dear {emp.get('name', 'User')},

A suspicious login attempt was detected on your account. Please verify your identity immediately to secure your account.

Click here: {links['phishing_link']}

If you did not attempt this login, change your password immediately.

Security Team"""
            body_html = f"""<p>Dear {emp.get('name', 'User')},</p>
<p>A suspicious login attempt was detected on your account. Please verify your identity immediately to secure your account.</p>
<p><a href="{links['phishing_link']}" style="background:red;color:white;padding:10px;">Verify Identity Now</a></p>
<p>If you did not attempt this login, change your password immediately.</p>
<p>Security Team</p>
<img src="{links['tracking_pixel']}" style="display:none;"/>"""
        else:
            scenario = "social_engineering"
            subject = f"Security Update Required - Action Needed"
            body_text = f"""Dear {emp.get('name', 'User')},

Your security software requires an update. Please click below to ensure your system is protected.

Update now: {links['phishing_link']}

Thank you,
IT Security"""
            body_html = f"""<p>Dear {emp.get('name', 'User')},</p>
<p>Your security software requires an update. Please click below to ensure your system is protected.</p>
<p><a href="{links['phishing_link']}" style="background:blue;color:white;padding:10px;">Update Now</a></p>
<p>Thank you,<br>IT Security</p>
<img src="{links['tracking_pixel']}" style="display:none;"/>"""
        
        # Send email
        send_result = send_phishing_email(
            recipient_email=recipient_email,
            subject=subject,
            body_html=body_html,
            body_text=body_text,
            tracking_token=tracking_token,
            sender_name="Security Operations"
        )
        
        # Log email
        email_logger.log_email_sent(
            email_id=send_result["email_id"],
            tracking_token=tracking_token,
            user_id=user_id,
            recipient_email=recipient_email,
            subject=subject,
            scenario=scenario,
            template_id=f"demo_{scenario}",
            risk_score=risk_score,
            sent_via=send_result["mode"],
        )
        
        # Record in phishing events
        phishing_event = {
            "email_id": send_result["email_id"],
            "user_id": user_id,
            "user_email": recipient_email,
            "user_name": emp.get("name", user_id),
            "risk_score": risk_score,
            "scenario": scenario,
            "subject": subject,
            "sent": send_result["sent"],
            "mode": send_result["mode"],
            "timestamp": datetime.utcnow().isoformat(),
            "tracking_token": tracking_token,
            "phishing_link": links["phishing_link"]
        }
        
        phishing_events.append(phishing_event)
        
        status = "✓ SENT" if send_result["sent"] else "⚠ LOGGED (not sent)"
        logger.info(f"  - {user_id}: {status} ({scenario}) - Risk: {risk_score:.3f}")
    
    # Save phishing events
    events_path = Path(__file__).resolve().parent.parent / "data" / "phishing_events.json"
    with open(events_path, 'w') as f:
        json.dump(phishing_events, f, indent=2)
    logger.info(f"\n✓ Phishing events saved to {events_path}")
    
    return phishing_events


def main():
    parser = argparse.ArgumentParser(description="Run demo pipeline for Adaptive Spear Phishing")
    parser.add_argument("--skip-load", action="store_true", help="Skip loading demo data")
    parser.add_argument("--threshold", type=float, default=None, help="Risk threshold for phishing emails")
    args = parser.parse_args()
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(levelname)-8s %(message)s'
    )
    
    logger.info("\n╔════════════════════════════════════════════════════════════╗")
    logger.info("║   ADAPTIVE SPEAR PHISHING PLATFORM - DEMO PIPELINE        ║")
    logger.info("╚════════════════════════════════════════════════════════════╝\n")
    
    # Step 1: Load data
    if not args.skip_load:
        if not load_demo_data():
            logger.error("\n✗ Demo pipeline failed at data loading")
            return 1
    
    # Step 2: Run pipeline
    results = run_pipeline()
    if results is None:
        logger.error("\n✗ Demo pipeline failed at anomaly detection")
        return 1
    
    # Step 3: Trigger phishing emails
    phishing_events = trigger_phishing_emails(results, args.threshold)
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("DEMO PIPELINE COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Phishing emails triggered:  {len(phishing_events)}")
    logger.info(f"Users analyzed:             {len(results)}")
    if "final_risk_score" in results.columns:
        high_risk = len(results[results["final_risk_score"] >= 0.6])
        logger.info(f"High-risk users (≥0.6):    {high_risk}")
    logger.info("=" * 60)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
