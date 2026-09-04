from app.agents.state import RecoveryState

def run(state: RecoveryState) -> dict:
    # Uses durable customer/payment signals available before outreach, avoiding invented LLM sentiment.
    engagement = float(state.get("engagement_score") or 0)
    overdue = int(state.get("days_overdue") or 0)
    score = max(0.05, min(0.95, 0.35 + engagement / 200 - overdue / 100))
    churn = round(max(0.05, min(0.95, 1 - score)), 3)
    return {"sentiment_score": round(score, 3), "sentiment": "positive" if score >= .65 else "neutral" if score >= .4 else "negative", "churn_risk_score": churn}
