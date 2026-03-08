"""Demo data loader for Adaptive Spear Phishing platform.

Loads demo employee data and behavior logs from JSON files and injects
them into the event store for pipeline processing.

Usage:
  python -m backend.scripts.load_demo_data
"""

import json
import logging
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.collector.event_store import EventStore
from backend.config import COLLECTOR_DB_PATH

logger = logging.getLogger(__name__)


def load_demo_data(clear_first: bool = False):
    """Load demo employees and behavior logs into the event store.
    
    Args:
        clear_first: If True, clears existing data before loading demo data
    """
    
    # Initialize event store
    store = EventStore(str(COLLECTOR_DB_PATH))
    
    # Load employees
    employees_path = Path(__file__).resolve().parent.parent / "data" / "employees.json"
    if not employees_path.exists():
        logger.warning(f"Employees file not found: {employees_path}")
        return False
    
    try:
        with open(employees_path, 'r') as f:
            employees = json.load(f)
        
        logger.info(f"Loading {len(employees)} demo employees...")
        for emp in employees:
            store.register_employee(
                user_id=emp['email'],
                name=emp['name'],
                email=emp['email'],
                employee_id=emp['employee_id'],
                device_id=f"dev_{emp['employee_id']}"
            )
        logger.info(f"Registered {len(employees)} employees")
    except Exception as e:
        logger.error(f"Failed to load employees: {e}")
        return False
    
    # Load behavior logs
    behavior_logs_path = Path(__file__).resolve().parent.parent / "data" / "behavior_logs.json"
    if not behavior_logs_path.exists():
        logger.warning(f"Behavior logs file not found: {behavior_logs_path}")
        return False
    
    try:
        with open(behavior_logs_path, 'r') as f:
            behavior_logs = json.load(f)
        
        logger.info(f"Loading {len(behavior_logs)} behavior events...")
        
        # Convert behavior logs to auth-like format for feature extraction
        # This normalizes the data into the format expected by the feature extractor
        auth_events = []
        
        for log in behavior_logs:
            email = log['email']
            timestamp = log['timestamp']
            
            # Extract hour from timestamp to determine if it's unusual
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                hour = dt.hour
            except:
                hour = 9
            
            # Create authentication event records
            # Map behavioral metrics to authentication-like events
            tabs_open = log.get('tabs_open', 5)
            session_length = log.get('session_length', 500)
            
            # Generate multiple auth events based on activity metrics
            # More tabs/longer session = more login attempts in this period
            auth_events_count = max(1, tabs_open // 3)
            
            for i in range(auth_events_count):
                auth_events.append({
                    'user': email,
                    'src_host': f'host_{email.split("@")[0]}_{i}',
                    'dst_host': f'auth.example.com',
                    'timestamp': timestamp,
                    'success': 1,  # Assume successful logins for behavioral analysis
                    'event_type': 'login_attempt',
                    'tab_burst_count': 1 if tabs_open >= 15 else 0,
                    'unusual_hours': 1 if hour < 7 or hour >= 22 else 0,
                    'typing_speed': log.get('typing_speed', 60),
                    'click_rate': log.get('click_rate', 2.0),
                    'session_length_sec': session_length
                })
        
        # Store auth events in database for feature extraction
        import pandas as pd
        df = pd.DataFrame(auth_events)
        
        # Write to temporary CSV for pipeline input
        auth_csv_path = Path(__file__).resolve().parent.parent / "data" / "demo_auth_events.csv"
        df.to_csv(auth_csv_path, index=False)
        logger.info(f"Generated {len(auth_events)} synthetic auth events, saved to {auth_csv_path}")
        
        # Also load into event store for real-time tracking
        from collections import defaultdict
        user_sessions = defaultdict(lambda: defaultdict(list))
        
        for log in behavior_logs:
            email = log['email']
            timestamp = log['timestamp']
            # Extract date for session grouping
            date = timestamp[:10]
            session_id = f"session_{email}_{date}"
            
            event = {
                'type': 'page_view',
                'timestamp': timestamp,
                'url': 'https://app.example.com',
                'data': {
                    'tabs_open': log.get('tabs_open', 0),
                    'session_length': log.get('session_length', 0),
                    'typing_speed': log.get('typing_speed', 0),
                    'click_rate': log.get('click_rate', 0)
                }
            }
            user_sessions[email][session_id].append(event)
        
        # Insert events for each user-session
        total_events = 0
        for email, sessions in user_sessions.items():
            for session_id, events in sessions.items():
                try:
                    store.insert_events(
                        user_id=email,
                        session_id=session_id,
                        events=events,
                        ip_address='192.168.1.100',
                        user_agent='DemoCollector/1.0'
                    )
                    total_events += len(events)
                except Exception as e:
                    logger.error(f"Failed to insert events for {email}: {e}")
        
        logger.info(f"Inserted {total_events} behavior events into event store")
        return True
        
    except Exception as e:
        logger.error(f"Failed to load behavior logs: {e}")
        return False


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    success = load_demo_data()
    sys.exit(0 if success else 1)
