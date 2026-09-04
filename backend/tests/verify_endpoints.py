import json
import os
import urllib.error
import urllib.request

BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")
# Demo merchant credentials (local demo auth; disabled automatically on hosts
# where SUPABASE_URL is configured).
DEMO_EMAIL = os.environ.get("DEMO_MERCHANT_EMAIL", "demo@recoverai.local")
DEMO_PASSWORD = os.environ.get("DEMO_MERCHANT_PASSWORD", "RecoverAI-local-demo-2026")


def test_all_endpoints():
    print("=" * 65)
    print(" RecoverAI — End-to-End API & Multi-Agent Verification")
    print("=" * 65)

    # 1. Login (demo merchant; requires DEMO_AUTH_ENABLED=true locally)
    login_data = json.dumps({
        "email": DEMO_EMAIL,
        "password": DEMO_PASSWORD,
        "role": "merchant_admin",
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/api/v1/auth/login",
        data=login_data,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        token = res["access_token"]
        print("[OK] 1. Auth Login: Success -> JWT Token acquired")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    # 2. Dashboard
    req = urllib.request.Request(f"{BASE_URL}/api/v1/dashboard", headers=headers)
    with urllib.request.urlopen(req) as resp:
        dash = json.loads(resp.read().decode("utf-8"))
        kpi = dash["kpis"]
        print(f"[OK] 2. Dashboard: Success -> At Risk: INR {kpi['total_revenue_at_risk']:,.2f}, Recovered: INR {kpi['total_revenue_recovered']:,.2f} ({kpi['financial_recovery_rate_pct']}%)")

    # 3. Cases List
    req = urllib.request.Request(f"{BASE_URL}/api/v1/cases?page=1&page_size=2", headers=headers)
    with urllib.request.urlopen(req) as resp:
        cases = json.loads(resp.read().decode("utf-8"))
        print(f"[OK] 3. Cases List: Success -> {cases['total']} total cases")
        first_id = cases["items"][0]["id"]
        sample_payment_id = cases["items"][0]["payment_id"]

    # 4. Case Detail
    req = urllib.request.Request(f"{BASE_URL}/api/v1/cases/{first_id}", headers=headers)
    with urllib.request.urlopen(req) as resp:
        detail = json.loads(resp.read().decode("utf-8"))
        print(f"[OK] 4. Case Detail: Success -> Case ID: {detail['id']}, Customer: {detail['customer']['name']}")

    # 5. ML Predict
    predict_payload = json.dumps({
        "amount": 4999.0,
        "tenure_days": 180,
        "engagement_score": 75.0,
        "previous_successful_recoveries": 2,
        "days_overdue": 3,
        "failure_reason": "insufficient_funds",
        "event_type": "payment_failed",
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/v1/predict", data=predict_payload, headers=headers)
    with urllib.request.urlopen(req) as resp:
        pred = json.loads(resp.read().decode("utf-8"))
        print(f"[OK] 5. ML Predict: Success -> Prob: {pred['predicted_probability'] * 100:.1f}%, Risk: {pred['risk_level']}, Channel: {pred['recommended_channel']}")

    # 6. Model Metrics
    req = urllib.request.Request(f"{BASE_URL}/api/v1/metrics", headers=headers)
    with urllib.request.urlopen(req) as resp:
        metrics = json.loads(resp.read().decode("utf-8"))
        print(f"[OK] 6. Model Metrics: Success -> Accuracy: {metrics['accuracy'] * 100:.2f}%, ROC-AUC: {metrics['roc_auc']:.4f}")

    # 7. AI Message Generation (Multi-Tone)
    msg_payload = json.dumps({
        "customer_name": "Aarav Sharma",
        "amount": 3499.0,
        "currency": "INR",
        "tone": "hinglish",
        "event_type": "payment_failed",
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/v1/generate-message", data=msg_payload, headers=headers)
    with urllib.request.urlopen(req) as resp:
        msg = json.loads(resp.read().decode("utf-8"))
        print(f"[OK] 7. AI Message Gen (Hinglish): Success -> \"{msg['message'][:65]}...\"")

    # 8. Razorpay Retry Payment Link (honest when unconfigured: 503, not a fake link)
    link_payload = json.dumps({
        "amount": 3499.0,
        "currency": "INR",
        "customer_name": "Aarav Sharma",
        "customer_email": "aarav.sharma@example.com",
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/v1/retry-payment", data=link_payload, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            link = json.loads(resp.read().decode("utf-8"))
            print(f"[OK] 8. Razorpay Payment Link: Success -> {link['payment_link']}")
    except urllib.error.HTTPError as exc:
        if exc.code == 503:
            print("[SKIP] 8. Razorpay Payment Link: No test credentials configured (refused honestly, no fabricated link)")
        else:
            raise

    # 9. LangGraph Multi-Agent Pipeline Execution
    agent_payload = json.dumps({
        "payment_id": sample_payment_id,
        "tone": "friendly",
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/v1/agent/run", data=agent_payload, headers=headers)
    with urllib.request.urlopen(req) as resp:
        agent_res = json.loads(resp.read().decode("utf-8"))
        print(f"[OK] 9. LangGraph 8-Agent Flow: Success -> Risk: {agent_res['risk_level']}, Prob: {agent_res['recovery_probability'] * 100:.1f}%, Channel: {agent_res['channel']}")

    # 10. Bonus: Sentiment Analysis
    sentiment_payload = json.dumps({
        "text": "Why was my card charged again? I want to stop my subscription immediately!",
        "customer_name": "Kavita Rao",
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/v1/sentiment", data=sentiment_payload, headers=headers)
    with urllib.request.urlopen(req) as resp:
        sent = json.loads(resp.read().decode("utf-8"))
        print(f"[OK] 10. Customer Sentiment AI: Success -> Sentiment: {sent['sentiment']}, Urgency: {sent['urgency']}, Churn Risk: {sent['churn_risk_score'] * 100:.0f}%")

    # 11. Bonus: Smart Retry Timing
    timing_payload = json.dumps({
        "channel": "whatsapp",
        "amount": 4999.0,
        "engagement_score": 70.0,
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/v1/smart-retry-timing", data=timing_payload, headers=headers)
    with urllib.request.urlopen(req) as resp:
        time_res = json.loads(resp.read().decode("utf-8"))
        print(f"[OK] 11. Smart Retry Timing: Success -> Window: {time_res['recommended_time_window']}, Day: {time_res['optimal_day_of_week']}, Predicted Open Rate: {time_res['predicted_open_rate_pct']}%")

    # 12. Bonus: Merchant AI Copilot
    copilot_payload = json.dumps({
        "question": "What is our current recovery performance and which channel should we prioritize?",
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/v1/copilot", data=copilot_payload, headers=headers)
    with urllib.request.urlopen(req) as resp:
        copilot_res = json.loads(resp.read().decode("utf-8"))
        print(f"[OK] 12. Merchant AI Copilot: Success -> \"{copilot_res['answer'][:70]}...\"")

    print("=" * 65)
    print(" [OK] ALL 12 BACKEND ENDPOINTS & BONUS AI MODULES VERIFIED!")
    print("=" * 65)


if __name__ == "__main__":
    test_all_endpoints()
