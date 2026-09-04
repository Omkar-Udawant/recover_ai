import asyncio
import json
import os
import pickle
import sys
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sqlalchemy import text
from xgboost import XGBClassifier

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.db.session import async_session
from app.ml.features import FEATURE_NAMES, extract_batch_features

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "metrics.json")


async def load_training_data():
    """
    Loads resolved historical recovery cases from the PostgreSQL database.
    """
    print("[*] Loading historical recovery records from PostgreSQL...")
    async with async_session() as session:
        query = text("""
            SELECT 
                rc.amount,
                c.tenure_days,
                c.engagement_score,
                c.previous_successful_recoveries,
                p.days_overdue,
                p.failure_reason,
                p.event_type,
                CASE WHEN rc.status = 'recovered' THEN 1 ELSE 0 END as target
            FROM recovery_cases rc
            JOIN customers c ON rc.customer_id = c.id
            JOIN payments p ON rc.payment_id = p.id
            WHERE rc.status IN ('recovered', 'lost');
        """)
        res = await session.execute(query)
        rows = res.fetchall()

    records = []
    targets = []
    for r in rows:
        records.append({
            "amount": float(r[0]),
            "tenure_days": int(r[1]),
            "engagement_score": float(r[2]),
            "previous_successful_recoveries": int(r[3]),
            "days_overdue": int(r[4] or 0),
            "failure_reason": r[5],
            "event_type": r[6],
        })
        targets.append(int(r[7]))

    X = extract_batch_features(records)
    y = np.array(targets, dtype=np.int32)
    return X, y


def train_and_evaluate(X: np.ndarray, y: np.ndarray):
    print(f"[*] Total dataset size: {len(X)} samples. Recovered: {sum(y)}, Lost: {len(y) - sum(y)}")
    
    # 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Train XGBoost model
    print("[*] Training XGBoost binary classification model...")
    model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        eval_metric="logloss",
    )
    model.fit(X_train, y_train)

    # Predict on test set
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    # Compute evaluation metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    auc = float(roc_auc_score(y_test, y_prob))
    cm = confusion_matrix(y_test, y_pred)

    cm_dict = {
        "true_negative": int(cm[0][0]),
        "false_positive": int(cm[0][1]),
        "false_negative": int(cm[1][0]),
        "true_positive": int(cm[1][1]),
    }

    feature_importances = {
        name: round(float(imp), 4)
        for name, imp in zip(FEATURE_NAMES, model.feature_importances_)
    }

    metrics = {
        "model_version": "v1.0-xgb",
        "total_samples": len(X),
        "test_samples": len(y_test),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(auc, 4),
        "confusion_matrix": cm_dict,
        "feature_importances": feature_importances,
    }

    # Save model artifact
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print(f"[+] Model artifact saved to: {MODEL_PATH}")

    # Save metrics JSON
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"[+] Model metrics saved to: {METRICS_PATH}")

    # Print summary
    print("\n" + "=" * 55)
    print(" RecoverAI — XGBoost Model Training Evaluation")
    print("=" * 55)
    print(f" • Accuracy:            {metrics['accuracy'] * 100:.2f}%")
    print(f" • Precision:           {metrics['precision'] * 100:.2f}%")
    print(f" • Recall:              {metrics['recall'] * 100:.2f}%")
    print(f" • F1-Score:            {metrics['f1_score']:.4f}")
    print(f" • ROC-AUC:             {metrics['roc_auc']:.4f}")
    print(f" • Confusion Matrix:    TP={cm_dict['true_positive']}, FP={cm_dict['false_positive']}, TN={cm_dict['true_negative']}, FN={cm_dict['false_negative']}")
    print(" • Feature Importances:")
    for feat, imp in feature_importances.items():
        print(f"   - {feat:<32}: {imp:.4f}")
    print("=" * 55 + "\n")

    return metrics


async def main():
    X, y = await load_training_data()
    train_and_evaluate(X, y)


if __name__ == "__main__":
    asyncio.run(main())
