import json
import random
from datetime import datetime, timedelta
import os

# March 5 and 6, 2026
DATES = [
    datetime(2026, 3, 5),
    datetime(2026, 3, 6)
]

DEVICES = {
    "akeshchandrasiri@gmail.com": "dev_akesh1",
    "finesse.clothing.lk@gmail.com": "dev_finesse",
    "nirominchandrasiri@gmail.com": "dev_niromi",
    "akeshchandrasiri@aiesec.net": "dev_akesh_aiesec"
}

URLS = [
    "https://github.com/dashboard",
    "https://mail.google.com",
    "https://slack.com/app",
    "https://jira.atlassian.com/board",
    "https://confluence.atlassian.com",
    "https://aws.amazon.com/console",
    "https://stackoverflow.com",
]

def generate_normal_day(email, emp_id, date, events_list):
    # Typical login 08:45 - 09:30
    login_min_offset = random.randint(45, 90)
    current_time = date + timedelta(hours=8, minutes=login_min_offset)
    
    events_list.append({
        "device_id": DEVICES.get(email, ""),
        "employee_id": emp_id,
        "email": email,
        "event_type": "login_attempt",
        "url": "https://company.okta.com/login",
        "timestamp": current_time.isoformat() + "Z"
    })
    
    current_time += timedelta(minutes=1)
    events_list.append({
        "device_id": DEVICES.get(email, ""),
        "employee_id": emp_id,
        "email": email,
        "event_type": "session_start",
        "url": "https://company.portal.com/home",
        "timestamp": current_time.isoformat() + "Z"
    })

    # Generate random browsing throughout the day
    end_time = date + timedelta(hours=18, minutes=random.randint(0, 30))
    
    while current_time < end_time:
        # Advance time by 5 to 45 mins
        current_time += timedelta(minutes=random.randint(5, 45))
        
        # Random action flow
        url = random.choice(URLS)
        events_list.append({
            "device_id": DEVICES.get(email, ""),
            "employee_id": emp_id,
            "email": email,
            "event_type": "tab_open",
            "url": url,
            "timestamp": current_time.isoformat() + "Z"
        })
        
        events_list.append({
            "device_id": DEVICES.get(email, ""),
            "employee_id": emp_id,
            "email": email,
            "event_type": "page_view",
            "url": url,
            "timestamp": (current_time + timedelta(seconds=2)).isoformat() + "Z"
        })
        
        if random.random() > 0.5:
            events_list.append({
                "device_id": DEVICES.get(email, ""),
                "employee_id": emp_id,
                "email": email,
                "event_type": "click",
                "url": url,
                "timestamp": (current_time + timedelta(seconds=15)).isoformat() + "Z"
            })
            
            
        events_list.append({
            "device_id": DEVICES.get(email, ""),
            "employee_id": emp_id,
            "email": email,
            "event_type": "tab_close",
            "url": url,
            "timestamp": (current_time + timedelta(minutes=random.randint(1, 10))).isoformat() + "Z"
        })
        
    # Logout around 18:30
    events_list.append({
        "device_id": DEVICES.get(email, ""),
        "employee_id": emp_id,
        "email": email,
        "event_type": "logout",
        "url": "https://company.okta.com/logout",
        "timestamp": end_time.isoformat() + "Z"
    })

def simulate_tab_burst(email, emp_id, date, events_list):
    # Do a normal login around 10:00
    current_time = date + timedelta(hours=10)
    events_list.append({
        "device_id": DEVICES.get(email, ""),
        "employee_id": emp_id,
        "email": email,
        "event_type": "login_attempt",
        "url": "https://company.okta.com/login",
        "timestamp": current_time.isoformat() + "Z"
    })
    
    events_list.append({
        "device_id": DEVICES.get(email, ""),
        "employee_id": emp_id,
        "email": email,
        "event_type": "session_start",
        "url": "https://company.portal.com/home",
        "timestamp": (current_time + timedelta(seconds=1)).isoformat() + "Z"
    })

    # Burst happens at 11:15
    burst_time = date + timedelta(hours=11, minutes=15)
    
    for i in range(35):
        events_list.append({
            "device_id": DEVICES.get(email, ""),
            "employee_id": emp_id,
            "email": email,
            "event_type": "navigation", # using navigation as per detect_suspicious_activity event types
            "url": random.choice(URLS),
            "timestamp": burst_time.isoformat() + "Z"
        })
        burst_time += timedelta(seconds=1) # 35 tabs in 35 seconds

    # Post-burst quiet
    end_time = date + timedelta(hours=17)
    events_list.append({
        "device_id": DEVICES.get(email, ""),
        "employee_id": emp_id,
        "email": email,
        "event_type": "logout",
        "url": "https://company.okta.com/logout",
        "timestamp": end_time.isoformat() + "Z"
    })

def simulate_unusual_logins(email, emp_id, date, events_list):
    # Login at 02:14
    time1 = date + timedelta(hours=2, minutes=14)
    # Login at 03:08
    time2 = date + timedelta(hours=3, minutes=8)

    for t in [time1, time2]:
        events_list.append({
            "device_id": DEVICES.get(email, ""),
            "employee_id": emp_id,
            "email": email,
            "event_type": "login_attempt",
            "url": "https://company.okta.com/login",
            "timestamp": t.isoformat() + "Z"
        })
        
        events_list.append({
            "device_id": DEVICES.get(email, ""),
            "employee_id": emp_id,
            "email": email,
            "event_type": "session_start",
            "url": "https://internal.admin.portal/dashboard",
            "timestamp": (t + timedelta(seconds=2)).isoformat() + "Z"
        })
        events_list.append({
            "device_id": DEVICES.get(email, ""),
            "employee_id": emp_id,
            "email": email,
            "event_type": "page_view",
            "url": "https://internal.admin.portal/download_db",
            "timestamp": (t + timedelta(minutes=5)).isoformat() + "Z"
        })

    # Brief normal activity
    end_time = date + timedelta(hours=16)
    events_list.append({
        "device_id": DEVICES.get(email, ""),
        "employee_id": emp_id,
        "email": email,
        "event_type": "logout",
        "url": "https://company.okta.com/logout",
        "timestamp": end_time.isoformat() + "Z"
    })


def main():
    events = []
    
    for date in DATES:
        generate_normal_day("akeshchandrasiri@gmail.com", "emp_n1", date, events)
        generate_normal_day("finesse.clothing.lk@gmail.com", "emp_n2", date, events)
        
        # Anomaly for niromi on March 5
        if date.day == 5:
            simulate_tab_burst("nirominchandrasiri@gmail.com", "emp_t1", date, events)
        else:
            generate_normal_day("nirominchandrasiri@gmail.com", "emp_t1", date, events)
            
        # Anomaly for akesh aiesec on March 6
        if date.day == 6:
            simulate_unusual_logins("akeshchandrasiri@aiesec.net", "emp_u1", date, events)
            
            # Phase 3: Add Phishing Victim Simulation
            events.append({
                "device_id": DEVICES.get("finesse.clothing.lk@gmail.com", ""),
                "employee_id": "emp_n2",
                "email": "finesse.clothing.lk@gmail.com",
                "event_type": "phishing_link_click",
                "url": "https://company.portal.com/urgent-update",
                "timestamp": (date + timedelta(hours=14, minutes=30)).isoformat() + "Z"
            })
        else:
            generate_normal_day("akeshchandrasiri@aiesec.net", "emp_u1", date, events)

    # Sort events chronologically
    events.sort(key=lambda x: x["timestamp"])

    output_dir = os.path.join(os.path.dirname(__file__), "..", "test_data")
    os.makedirs(output_dir, exist_ok=True)
    out_file = os.path.join(output_dir, "events.json")
    
    with open(out_file, "w") as f:
        json.dump(events, f, indent=2)

    print(f"Generated {len(events)} synthetic events and saved to {out_file}")

if __name__ == "__main__":
    main()
