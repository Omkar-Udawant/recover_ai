# RecoverAI — Complete API Reference

All endpoints are hosted at `http://localhost:8000`.
Interactive Swagger UI is available at [`http://localhost:8000/docs`](http://localhost:8000/docs).

---

## 🔑 Authentication

All protected endpoints require a Bearer token in the `Authorization` header:
`Authorization: Bearer <JWT_TOKEN>`

### 1. `POST /api/v1/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@recoverai.com",
    "password": "password123",
    "role": "merchant_admin"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in_minutes": 1440,
    "user": {
      "email": "admin@recoverai.com",
      "role": "merchant_admin",
      "name": "Admin"
    }
  }
  ```

---

## 📊 Analytics & Dashboard

### 2. `GET /api/v1/dashboard`
- **Access**: Bearer JWT
- **Returns**: 12 KPIs + 5 Aggregated Charts (Recovery trend, failure reasons, channel performance, risk distribution, recovery funnel).

---

## 📁 Recovery Cases

### 3. `GET /api/v1/cases`
- **Access**: Bearer JWT
- **Query Params**: `status`, `risk_level`, `channel`, `search`, `min_amount`, `max_amount`, `page`, `page_size`, `sort_by`, `sort_order`
- **Returns**: Paginated list of recovery cases with customer and payment details.

### 4. `GET /api/v1/cases/{id}`
- **Access**: Bearer JWT
- **Returns**: Full case dossier including customer profile, payment details, recovery action timeline, and audit logs.

---

## 🧠 Machine Learning & Predictions

### 5. `POST /api/v1/predict`
- **Access**: Bearer JWT
- **Request Body**:
  ```json
  {
    "amount": 4999.0,
    "tenure_days": 180,
    "engagement_score": 75.0,
    "previous_successful_recoveries": 2,
    "days_overdue": 3,
    "failure_reason": "insufficient_funds",
    "event_type": "payment_failed"
  }
  ```
- **Returns**: Real-time XGBoost probability score, risk tier, and recommended outreach channel.

### 6. `GET /api/v1/metrics`
- **Access**: Bearer JWT
- **Returns**: XGBoost model evaluation metrics (Accuracy, Precision, Recall, F1, ROC-AUC, Confusion Matrix, Feature Importances).

---

## 🤖 Multi-Agent Orchestration & Integrations

### 7. `POST /api/v1/agent/run`
- **Access**: Bearer JWT
- **Description**: Triggers the 6-agent LangGraph workflow for a payment event or case.
- **Request Body**:
  ```json
  {
    "payment_id": "optional-uuid",
    "case_id": "optional-uuid",
    "tone": "friendly"
  }
  ```

### 8. `POST /api/v1/generate-message`
- **Access**: Bearer JWT
- **Description**: Generates personalized AI copy via Gemini across 4 tones (`professional`, `friendly`, `hinglish`, `formal`).

### 9. `POST /api/v1/retry-payment`
- **Access**: Bearer JWT
- **Description**: Generates a secure test-mode payment link via Razorpay client.

---

## ✨ Bonus AI Capabilities

### 10. `POST /api/v1/sentiment`
- **Access**: Bearer JWT
- **Description**: Analyzes inbound customer response text for sentiment, urgency, and churn risk.

### 11. `POST /api/v1/smart-retry-timing`
- **Access**: Bearer JWT
- **Description**: Predicts the optimal time window, day of the week, and expected open rate per channel.

### 12. `POST /api/v1/copilot`
- **Access**: Bearer JWT
- **Description**: Merchant AI Copilot answering natural language questions using live recovery KPIs as context.
# Production additions

`POST /api/v1/payment-link` creates a real Razorpay link and persists a reconciliation record. It requires a bearer token and body: `case_id`, `amount`, `currency`, `customer_name`, `customer_email`, and `customer_phone`. It returns `payment_link`, `order_id`, `amount`, `status`, and `link_id`.

`POST /api/v1/webhooks/razorpay` is Razorpay-only. It verifies `X-Razorpay-Signature`, updates `payment_attempts`, and marks the linked recovery case recovered when paid.
