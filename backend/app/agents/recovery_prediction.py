import os
import pickle
from app.agents.state import RecoveryState
from app.ml.features import extract_features

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "model.pkl")
_cached_model = None


def _get_model():
    global _cached_model
    if _cached_model is None and os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, "rb") as f:
                _cached_model = pickle.load(f)
        except Exception:
            _cached_model = None
    return _cached_model


def run(state: RecoveryState) -> RecoveryState:
    """
    Agent 2 — Recovery Prediction:
    Runs the XGBoost ML model to calculate exact recovery probability and refine risk tier.
    """
    model = _get_model()
    features = extract_features(state)

    if model is not None:
        try:
            prob = float(model.predict_proba(features.reshape(1, -1))[0, 1])
        except Exception:
            prob = 0.50
    else:
        # Logistic heuristic fallback
        eng = float(state.get("engagement_score") or 55.0)
        prev = int(state.get("previous_successful_recoveries") or 0)
        amt = float(state.get("amount") or 0.0)
        days = int(state.get("days_overdue") or 0)
        z = -0.85 + 0.032 * eng + 0.42 * prev - 0.00010 * amt - 0.040 * days
        prob = float(1.0 / (1.0 + (2.71828 ** (-z))))

    prob_rounded = round(float(prob), 3)
    state["recovery_probability"] = prob_rounded

    # Refine risk level based on ML prediction
    if prob_rounded >= 0.65:
        state["risk_level"] = "low"
    elif prob_rounded >= 0.35:
        state["risk_level"] = "medium"
    else:
        state["risk_level"] = "high"

    return state
