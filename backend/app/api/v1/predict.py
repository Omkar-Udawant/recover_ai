import json
import os
import pickle
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.ml.features import extract_features
from app.schemas.common import TokenPayload
from app.schemas.predict import MetricsResponse, PredictionRequest, PredictionResponse

router = APIRouter(tags=["ML Recovery Prediction"])

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "model.pkl")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "metrics.json")

# In-memory model cache
_cached_model = None


def get_model():
    global _cached_model
    if _cached_model is None:
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, "rb") as f:
                _cached_model = pickle.load(f)
    return _cached_model


@router.post("/predict", response_model=PredictionResponse)
async def predict_recovery_probability(
    payload: PredictionRequest,
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Run the XGBoost ML model to calculate recovery probability and recommended outreach channel.
    """
    model = get_model()
    features = extract_features(payload.model_dump())

    prob = None
    if model is not None:
        # Inference via trained XGBoost model
        try:
            prob = float(model.predict_proba(features.reshape(1, -1))[0, 1])
        except Exception:
            prob = None
    if prob is None:
        # Identical-tree inference without the xgboost stack (serverless-safe)
        try:
            from app.ml import xgb_lite
            from app.ml.features import FEATURE_NAMES
            if xgb_lite.is_available():
                prob = float(xgb_lite.predict_proba_row(list(features), FEATURE_NAMES))
        except Exception:
            prob = None
    if prob is None:
        # Heuristic fallback if no model artifact is usable
        z = (
            -0.85
            + 0.032 * payload.engagement_score
            + 0.42 * payload.previous_successful_recoveries
            - 0.00010 * payload.amount
            - 0.040 * payload.days_overdue
        )
        prob = float(1.0 / (1.0 + (2.71828 ** (-z))))

    prob_rounded = round(prob, 3)

    # Determine risk level
    if prob_rounded >= 0.65:
        risk_level = "low"
    elif prob_rounded >= 0.35:
        risk_level = "medium"
    else:
        risk_level = "high"

    # Determine recommended channel
    if payload.amount >= 10000 or risk_level == "high":
        recommended_channel = "whatsapp"
    elif risk_level == "medium":
        recommended_channel = "email"
    else:
        recommended_channel = "sms"

    return PredictionResponse(
        predicted_probability=prob_rounded,
        risk_level=risk_level,
        recommended_channel=recommended_channel,
        model_version="v1.0-xgb",
    )


@router.get("/metrics", response_model=MetricsResponse)
async def get_model_metrics(
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Retrieve model evaluation metrics: accuracy, precision, recall, F1, ROC-AUC,
    confusion matrix, and feature importances.
    """
    if not os.path.exists(METRICS_PATH):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model metrics have not been generated yet. Run train.py first.",
        )

    with open(METRICS_PATH, "r", encoding="utf-8") as f:
        metrics = json.load(f)

    return metrics
