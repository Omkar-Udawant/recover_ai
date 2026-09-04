from typing import Any, Dict, List
import numpy as np

FAILURE_REASON_MAP = {
    "insufficient_funds": 0,
    "card_declined": 1,
    "gateway_timeout": 2,
    "expired_card": 3,
    "bank_error": 4,
    "checkout_abandoned": 5,
    "payment_overdue": 6,
}

EVENT_TYPE_MAP = {
    "payment_failed": 0,
    "checkout_abandoned": 1,
    "invoice_overdue": 2,
    "subscription_failed": 3,
}

FEATURE_NAMES = [
    "amount",
    "tenure_days",
    "engagement_score",
    "previous_successful_recoveries",
    "days_overdue",
    "failure_reason_code",
    "event_type_code",
]


def extract_features(data: Dict[str, Any]) -> np.ndarray:
    """
    Extracts a 1D numerical feature array from a dictionary input for model inference.
    """
    amount = float(data.get("amount", 0.0))
    tenure_days = int(data.get("tenure_days", 0))
    engagement_score = float(data.get("engagement_score", 50.0))
    prev_recoveries = int(data.get("previous_successful_recoveries", 0))
    days_overdue = int(data.get("days_overdue", 0))

    failure_reason = str(data.get("failure_reason") or "").lower()
    failure_reason_code = FAILURE_REASON_MAP.get(failure_reason, 7)

    event_type = str(data.get("event_type") or "").lower()
    event_type_code = EVENT_TYPE_MAP.get(event_type, 4)

    return np.array(
        [
            amount,
            tenure_days,
            engagement_score,
            prev_recoveries,
            days_overdue,
            failure_reason_code,
            event_type_code,
        ],
        dtype=np.float32,
    )


def extract_batch_features(records: List[Dict[str, Any]]) -> np.ndarray:
    """
    Extracts a 2D numerical matrix for batch training and inference.
    """
    return np.array([extract_features(r) for r in records], dtype=np.float32)
