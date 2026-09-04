import asyncio
import csv
import os
import random
import sys
import time
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List

import numpy as np
from faker import Faker
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.db.session import async_session, engine
from app.models import (
    AuditLog,
    Customer,
    Payment,
    Prediction,
    RecoveryAction,
    RecoveryCase,
    Subscription,
)

# Seed for reproducibility
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
fake = Faker("en_IN")
Faker.seed(SEED)

NUM_CUSTOMERS = 10000
NUM_PAYMENTS = 20000
NUM_RECOVERY_CASES = 5000
CHUNK_SIZE = 1000


def get_data_dir() -> str:
    # Try finding data dir in project root or relative to script
    potential_paths = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data")),
        "/data",
        "/app/data",
    ]
    for path in potential_paths:
        if os.path.exists(path):
            return path
    # Default to creating in ../../data
    default_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
    os.makedirs(default_path, exist_ok=True)
    return default_path


def generate_customers(num_customers: int) -> List[Dict[str, Any]]:
    print(f"[*] Generating {num_customers} synthetic customer profiles...")
    customers = []
    
    # Statistical distributions
    # Right-skewed tenure: Gamma distribution (mean ~150 days, range 10-900)
    tenures = np.random.gamma(shape=2.5, scale=60, size=num_customers).astype(int) + 10
    tenures = np.clip(tenures, 10, 1200)

    # Engagement score: Normal distribution (mean 55, std 15, clipped 5.0 - 99.0)
    engagement_scores = np.random.normal(loc=55.0, scale=15.0, size=num_customers)
    engagement_scores = np.clip(engagement_scores, 5.0, 99.0)

    # Previous successful recoveries: Poisson distribution (lambda=1.2)
    recoveries = np.random.poisson(lam=1.2, size=num_customers)

    base_time = datetime.now(timezone.utc) - timedelta(days=365 * 2)

    for i in range(num_customers):
        created_days_ago = int(tenures[i]) + random.randint(0, 30)
        created_at = datetime.now(timezone.utc) - timedelta(days=created_days_ago)
        
        customer_id = uuid.uuid4()
        name = fake.name()
        email = f"{name.lower().replace(' ', '.').replace("'", '')}.{str(customer_id)[:6]}@{fake.free_email_domain()}"
        phone = f"+91 {random.choice(['98', '99', '97', '96', '91', '88', '87', '70'])}{random.randint(10000000, 99999999)}"

        customers.append({
            "id": customer_id,
            "name": name,
            "email": email,
            "phone": phone,
            "tenure_days": int(tenures[i]),
            "engagement_score": round(float(engagement_scores[i]), 2),
            "previous_successful_recoveries": int(recoveries[i]),
            "created_at": created_at,
        })
    return customers


def generate_subscriptions(customers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    print(f"[*] Generating synthetic subscription records...")
    subscriptions = []
    plans = [
        {"name": "Starter Plan", "mrr": 999.00, "weight": 0.50},
        {"name": "Growth Pro", "mrr": 2999.00, "weight": 0.35},
        {"name": "Enterprise Scale", "mrr": 9999.00, "weight": 0.15},
    ]
    plan_names = [p["name"] for p in plans]
    plan_weights = [p["weight"] for p in plans]
    plan_mrr_map = {p["name"]: p["mrr"] for p in plans}

    # ~60% of customers have active/past subscriptions
    sub_customers = random.sample(customers, k=int(len(customers) * 0.60))

    for cust in sub_customers:
        plan = random.choices(plan_names, weights=plan_weights)[0]
        status = random.choices(["active", "past_due", "cancelled"], weights=[0.80, 0.15, 0.05])[0]
        renewal_days = random.randint(-15, 30)
        renewal_date = (datetime.now(timezone.utc) + timedelta(days=renewal_days)).date()
        created_at = cust["created_at"] + timedelta(days=random.randint(1, 10))

        subscriptions.append({
            "id": uuid.uuid4(),
            "customer_id": cust["id"],
            "plan_name": plan,
            "mrr": Decimal(str(plan_mrr_map[plan])),
            "status": status,
            "renewal_date": renewal_date,
            "created_at": created_at,
        })
    return subscriptions


def generate_payments(customers: List[Dict[str, Any]], num_payments: int) -> List[Dict[str, Any]]:
    print(f"[*] Generating {num_payments} payment events (~70% success / ~30% failure)...")
    payments = []
    
    # 70% success, 30% failure
    num_failures = int(num_payments * 0.30)
    num_success = num_payments - num_failures

    # Failure events breakdown:
    # payment_failed (45%), checkout_abandoned (30%), invoice_overdue (15%), subscription_failed (10%)
    failure_event_types = ["payment_failed", "checkout_abandoned", "invoice_overdue", "subscription_failed"]
    failure_event_weights = [0.45, 0.30, 0.15, 0.10]

    # Failure reasons:
    # insufficient_funds (35%), card_declined (25%), gateway_timeout (15%), expired_card (15%), bank_error (10%)
    failure_reasons = ["insufficient_funds", "card_declined", "gateway_timeout", "expired_card", "bank_error"]
    failure_reason_weights = [0.35, 0.25, 0.15, 0.15, 0.10]

    # Realistic amounts (Log-normal distribution: mean ~₹3,500, range ₹499 to ₹49,999)
    raw_amounts = np.random.lognormal(mean=7.8, sigma=0.85, size=num_payments)
    raw_amounts = np.clip(raw_amounts, 499.0, 49999.0)

    now = datetime.now(timezone.utc)

    # 1. Generate Success Payments
    for i in range(num_success):
        cust = random.choice(customers)
        days_ago = random.randint(1, 90)
        created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        amount = round(float(raw_amounts[i]), 2)

        payments.append({
            "id": uuid.uuid4(),
            "customer_id": cust["id"],
            "amount": Decimal(str(amount)),
            "currency": "INR",
            "status": "success",
            "failure_reason": None,
            "event_type": "payment_success",
            "days_overdue": 0,
            "created_at": created_at,
        })

    # 2. Generate Failure-type Payments
    for i in range(num_failures):
        cust = random.choice(customers)
        days_ago = random.randint(1, 90)
        created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        amount = round(float(raw_amounts[num_success + i]), 2)

        event_type = random.choices(failure_event_types, weights=failure_event_weights)[0]
        failure_reason = random.choices(failure_reasons, weights=failure_reason_weights)[0]
        
        if event_type == "checkout_abandoned":
            status = "abandoned"
            failure_reason = "checkout_abandoned"
            days_overdue = random.randint(1, 14)
        elif event_type == "invoice_overdue":
            status = "overdue"
            failure_reason = "payment_overdue"
            days_overdue = random.randint(5, 45)
        else:
            status = "failed"
            days_overdue = random.randint(1, 30)

        payments.append({
            "id": uuid.uuid4(),
            "customer_id": cust["id"],
            "amount": Decimal(str(amount)),
            "currency": "INR",
            "status": status,
            "failure_reason": failure_reason,
            "event_type": event_type,
            "days_overdue": days_overdue,
            "created_at": created_at,
        })

    # Shuffle to interleave timestamps
    random.shuffle(payments)
    return payments


def generate_recovery_cases_and_actions(
    customers: List[Dict[str, Any]],
    payments: List[Dict[str, Any]],
    num_cases: int,
) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    print(f"[*] Generating {num_cases} recovery cases with realistic ML logistic signal + noise...")

    # Filter failed payment events
    failed_payments = [p for p in payments if p["status"] in ["failed", "abandoned", "overdue"]]
    if len(failed_payments) < num_cases:
        selected_payments = failed_payments
    else:
        selected_payments = random.sample(failed_payments, k=num_cases)

    customer_map = {c["id"]: c for c in customers}

    recovery_cases = []
    recovery_actions = []
    predictions = []
    audit_logs = []

    channels = ["email", "whatsapp", "sms", "voice_call"]
    channel_weights = [0.40, 0.35, 0.20, 0.05]

    for p in selected_payments:
        cust = customer_map.get(p["customer_id"])
        if not cust:
            continue

        case_id = uuid.uuid4()
        amount = float(p["amount"])
        eng_score = float(cust["engagement_score"])
        prev_recoveries = int(cust["previous_successful_recoveries"])
        days_overdue = int(p["days_overdue"])
        tenure = int(cust["tenure_days"])

        # Logistic recovery probability formula with noise:
        # High engagement, low amount, short overdue, previous recoveries => High probability
        noise = np.random.normal(loc=0.0, scale=0.38)
        z = (
            -0.85
            + 0.032 * eng_score
            + 0.42 * prev_recoveries
            - 0.00010 * amount
            - 0.040 * days_overdue
            + 0.0008 * min(tenure, 365)
            + noise
        )
        # Sigmoid function
        prob = 1.0 / (1.0 + np.exp(-z))
        prob = float(np.clip(prob, 0.04, 0.96))
        prob_rounded = round(prob, 3)

        # Assign Risk Level
        if prob_rounded >= 0.65:
            risk_level = "low"
        elif prob_rounded >= 0.35:
            risk_level = "medium"
        else:
            risk_level = "high"

        # Channel selection: smarter channel based on amount & engagement
        if amount > 10000 or risk_level == "high":
            assigned_channel = random.choices(["whatsapp", "voice_call", "email"], weights=[0.5, 0.3, 0.2])[0]
        else:
            assigned_channel = random.choices(channels, weights=channel_weights)[0]

        # Determine outcome: Bernoulli trial based on probability
        is_recovered = np.random.binomial(n=1, p=prob_rounded) == 1
        created_at = p["created_at"] + timedelta(hours=random.randint(1, 6))

        # Determine final status and recovered_at
        days_since_created = (datetime.now(timezone.utc) - created_at).days

        if days_since_created <= 3:
            # Active in-flight cases for live dashboard demo
            status = random.choices(["pending", "contacted", "link_opened", "payment_attempted"], weights=[0.2, 0.4, 0.25, 0.15])[0]
            recovered_at = None
        else:
            # Historical cases
            if is_recovered:
                status = "recovered"
                recovery_delay_hours = random.randint(4, 72)
                recovered_at = created_at + timedelta(hours=recovery_delay_hours)
            else:
                status = "lost"
                recovered_at = None

        recovery_cases.append({
            "id": case_id,
            "customer_id": cust["id"],
            "payment_id": p["id"],
            "risk_level": risk_level,
            "recovery_probability": Decimal(str(prob_rounded)),
            "status": status,
            "assigned_channel": assigned_channel,
            "amount": p["amount"],
            "created_at": created_at,
            "recovered_at": recovered_at,
        })

        # Generate corresponding RecoveryAction
        action_status_map = {
            "pending": "sent",
            "contacted": "opened",
            "link_opened": "clicked",
            "payment_attempted": "clicked",
            "recovered": "paid",
            "lost": "failed",
        }
        action_status = action_status_map.get(status, "sent")
        short_link = f"https://rzp.io/i/{str(case_id)[:8]}"

        action_id = uuid.uuid4()
        recovery_actions.append({
            "id": action_id,
            "case_id": case_id,
            "channel": assigned_channel,
            "message_content": f"Hi {cust['name']}, your payment of INR {amount:.2f} needs attention. Complete securely: {short_link}",
            "payment_link": short_link,
            "action_status": action_status,
            "created_at": created_at + timedelta(minutes=10),
        })

        # Generate corresponding Prediction record
        features_dict = {
            "amount": amount,
            "tenure_days": tenure,
            "engagement_score": eng_score,
            "previous_successful_recoveries": prev_recoveries,
            "days_overdue": days_overdue,
            "failure_reason": p["failure_reason"],
            "event_type": p["event_type"],
        }
        predictions.append({
            "id": uuid.uuid4(),
            "case_id": case_id,
            "model_version": "v1.0-xgb",
            "features": features_dict,
            "predicted_probability": Decimal(str(prob_rounded)),
            "created_at": created_at,
        })

        # Generate Audit Log for case creation & transition
        audit_logs.append({
            "id": uuid.uuid4(),
            "actor": "agent_risk_detection",
            "action": f"case_created_{risk_level}_risk",
            "entity_type": "recovery_case",
            "entity_id": case_id,
            "metadata": {
                "risk_level": risk_level,
                "recovery_probability": prob_rounded,
                "assigned_channel": assigned_channel,
                "amount": amount,
            },
            "created_at": created_at,
        })

    return recovery_cases, recovery_actions, predictions, audit_logs


def export_to_csv(data_dir: str, customers: List[Dict], payments: List[Dict], recovery_cases: List[Dict]):
    print(f"[*] Exporting CSV files to {data_dir}...")
    
    # 1. customers.csv
    cust_path = os.path.join(data_dir, "customers.csv")
    with open(cust_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "id", "name", "email", "phone", "tenure_days",
            "engagement_score", "previous_successful_recoveries", "created_at"
        ])
        for c in customers:
            writer.writerow([
                str(c["id"]), c["name"], c["email"], c["phone"], c["tenure_days"],
                c["engagement_score"], c["previous_successful_recoveries"],
                c["created_at"].isoformat()
            ])
    print(f"    [+] Saved {len(customers)} rows to {cust_path}")

    # 2. payments.csv
    pay_path = os.path.join(data_dir, "payments.csv")
    with open(pay_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "id", "customer_id", "amount", "currency", "status",
            "failure_reason", "event_type", "days_overdue", "created_at"
        ])
        for p in payments:
            writer.writerow([
                str(p["id"]), str(p["customer_id"]), str(p["amount"]), p["currency"],
                p["status"], p["failure_reason"] or "", p["event_type"],
                p["days_overdue"], p["created_at"].isoformat()
            ])
    print(f"    [+] Saved {len(payments)} rows to {pay_path}")

    # 3. recovery_cases.csv
    cases_path = os.path.join(data_dir, "recovery_cases.csv")
    with open(cases_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "id", "customer_id", "payment_id", "risk_level", "recovery_probability",
            "status", "assigned_channel", "amount", "created_at", "recovered_at"
        ])
        for rc in recovery_cases:
            writer.writerow([
                str(rc["id"]), str(rc["customer_id"]), str(rc["payment_id"]),
                rc["risk_level"], str(rc["recovery_probability"]), rc["status"],
                rc["assigned_channel"], str(rc["amount"]),
                rc["created_at"].isoformat(),
                rc["recovered_at"].isoformat() if rc["recovered_at"] else ""
            ])
    print(f"    [+] Saved {len(recovery_cases)} rows to {cases_path}")


async def seed_database(
    customers: List[Dict],
    subscriptions: List[Dict],
    payments: List[Dict],
    recovery_cases: List[Dict],
    recovery_actions: List[Dict],
    predictions: List[Dict],
    audit_logs: List[Dict],
):
    print(f"[*] Seeding PostgreSQL database via SQLAlchemy async batch inserts...")
    start_time = time.time()

    async with async_session() as session:
        # Clear existing data for clean idempotent seeding
        print("    [-] Truncating existing tables...")
        await session.execute(text("TRUNCATE TABLE audit_logs, predictions, recovery_actions, recovery_cases, subscriptions, payments, customers CASCADE;"))
        await session.commit()

        # Batch insert customers
        print(f"    [+] Inserting {len(customers)} customers...")
        for i in range(0, len(customers), CHUNK_SIZE):
            chunk = [Customer(**c) for c in customers[i : i + CHUNK_SIZE]]
            session.add_all(chunk)
            await session.flush()
        await session.commit()

        # Batch insert subscriptions
        print(f"    [+] Inserting {len(subscriptions)} subscriptions...")
        for i in range(0, len(subscriptions), CHUNK_SIZE):
            chunk = [Subscription(**s) for s in subscriptions[i : i + CHUNK_SIZE]]
            session.add_all(chunk)
            await session.flush()
        await session.commit()

        # Batch insert payments
        print(f"    [+] Inserting {len(payments)} payments...")
        for i in range(0, len(payments), CHUNK_SIZE):
            chunk = [Payment(**p) for p in payments[i : i + CHUNK_SIZE]]
            session.add_all(chunk)
            await session.flush()
        await session.commit()

        # Batch insert recovery cases
        print(f"    [+] Inserting {len(recovery_cases)} recovery cases...")
        for i in range(0, len(recovery_cases), CHUNK_SIZE):
            chunk = [RecoveryCase(**rc) for rc in recovery_cases[i : i + CHUNK_SIZE]]
            session.add_all(chunk)
            await session.flush()
        await session.commit()

        # Batch insert recovery actions
        print(f"    [+] Inserting {len(recovery_actions)} recovery actions...")
        for i in range(0, len(recovery_actions), CHUNK_SIZE):
            chunk = [RecoveryAction(**ra) for ra in recovery_actions[i : i + CHUNK_SIZE]]
            session.add_all(chunk)
            await session.flush()
        await session.commit()

        # Batch insert predictions
        print(f"    [+] Inserting {len(predictions)} predictions...")
        for i in range(0, len(predictions), CHUNK_SIZE):
            chunk = [Prediction(**pr) for pr in predictions[i : i + CHUNK_SIZE]]
            session.add_all(chunk)
            await session.flush()
        await session.commit()

        # Batch insert audit logs
        print(f"    [+] Inserting {len(audit_logs)} audit logs...")
        for i in range(0, len(audit_logs), CHUNK_SIZE):
            chunk = [AuditLog(**al) for al in audit_logs[i : i + CHUNK_SIZE]]
            session.add_all(chunk)
            await session.flush()
        await session.commit()

    duration = time.time() - start_time
    print(f"[✓] Database seeding completed successfully in {duration:.2f} seconds!")


async def main():
    print("=" * 70)
    print(" RecoverAI — Synthetic Data Generation & Database Seeder")
    print("=" * 70)
    
    total_start = time.time()

    # 1. Generate data structures
    customers = generate_customers(NUM_CUSTOMERS)
    subscriptions = generate_subscriptions(customers)
    payments = generate_payments(customers, NUM_PAYMENTS)
    recovery_cases, recovery_actions, predictions, audit_logs = generate_recovery_cases_and_actions(
        customers, payments, NUM_RECOVERY_CASES
    )

    # 2. Export CSV files
    data_dir = get_data_dir()
    export_to_csv(data_dir, customers, payments, recovery_cases)

    # 3. Seed PostgreSQL database
    await seed_database(
        customers, subscriptions, payments, recovery_cases, recovery_actions, predictions, audit_logs
    )

    total_duration = time.time() - total_start
    print("=" * 70)
    print(f"All synthetic data generated, exported, and seeded in {total_duration:.2f}s!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
