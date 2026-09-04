# RecoverAI — Autonomous AI Revenue Recovery Agent

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.1-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2+-orange.svg)](https://langchain-ai.github.io/langgraph/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.1+-red.svg)](https://xgboost.readthedocs.io)
[![Razorpay](https://img.shields.io/badge/Razorpay-Test%20Mode-0C2340.svg?logo=razorpay&logoColor=white)](https://razorpay.com)

RecoverAI is an autonomous, agentic AI platform that detects revenue leakage (failed payments, abandoned checkouts, overdue invoices, failed renewals), predicts recovery likelihood with classical ML, and orchestrates personalized, multi-channel outreach through a 6-agent LangGraph pipeline — with a real-time dashboard proving ROI.

---

## 🚀 One-Command Quickstart

### 1. Configure Environment
```bash
cp .env.example .env
```

### 2. Launch Entire Platform via Docker Compose
```bash
docker compose up -d --build
```
This starts:
- **PostgreSQL 16** at port `5432`
- **FastAPI Backend** at `http://localhost:8000` (OpenAPI Docs at `http://localhost:8000/docs`)
- **Next.js 15 Frontend** at `http://localhost:3000`

### 3. Run Database Migrations & Seed Synthetic Dataset
```bash
# Run database schema migrations
docker compose exec backend alembic upgrade head

# Generate & seed 10,000 customers, 20,000 payments, and 5,000 recovery cases
docker compose exec backend python scripts/generate_synthetic_data.py

# Verify statistical data distribution
docker compose exec backend python scripts/verify_data.py
```

### 4. Sign In (Local Demo — No External Keys Needed)
Open [http://localhost:3000/login](http://localhost:3000/login) and sign in with the demo
merchant from your root `.env` (`DEMO_MERCHANT_EMAIL` / `DEMO_MERCHANT_PASSWORD`).
No Supabase, Gemini, or Razorpay keys required: AI copy uses honest fallbacks and
payment links report “pending” instead of fabricated URLs.

### 5. Train the ML Model (Optional — Pre-trained artifact included)
```bash
docker compose exec backend python app/ml/train.py
```

---

## 🖥️ Live User Interfaces & Links

- **Recovery Command Center**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Live Cases Directory & Agent Trigger**: [http://localhost:3000/cases](http://localhost:3000/cases)
- **FastAPI Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **FastAPI ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🤖 The 8-Agent LangGraph Architecture

```mermaid
graph LR
    A[Payment Event] --> B[1. Risk Detection]
    B --> C[2. ML Recovery Prediction]
    C --> D[3. Sentiment & Churn]
    D --> E[4. Recommendation & Timing]
    E --> F[5. Gemini Channel Selection]
    F --> G[6. Razorpay Payment Retry]
    G --> H[7. Gemini Message Gen]
    H --> I[8. Recovery Tracking]
    I --> J[(PostgreSQL 16)]
```

1. **Risk Detection**: Rule-based triage categorizing transaction events into High, Medium, or Low risk.
2. **Recovery Prediction**: XGBoost classifier calculating recovery probability ($0.04\text{--}0.96$).
3. **Sentiment & Churn**: Deterministic engagement/overdue scoring persisted to `customer_sentiment`.
4. **Recommendation & Timing**: Channel/discount/retry-window recommendation persisted to `recommendations`.
5. **Channel Selection**: Google Gemini LLM selecting the highest-converting channel (`whatsapp`, `email`, `sms`, `voice_call`).
6. **Payment Retry**: Razorpay integration generating secure test-mode payment links. Never fabricates links — failures are recorded as `payment_link_failed` with no link.
7. **Message Generation**: Google Gemini copywriting engine personalizing outreach across 4 tones (`professional`, `friendly`, `hinglish`, `formal`).
8. **Recovery Tracking**: State machine persisting case transitions, actions, predictions, recommendations, sentiment, agent executions, and audit logs.

---

## 📊 Proven Business Impact (Seed Metrics)

- **Total Revenue At Risk**: **₹18,045,006.38** (5,000 cases)
- **Revenue Won Back**: **₹9,602,231.64** (**55.0% Recovery Rate**)
- **Estimated ROI Multiplier**: **21.3x** net financial return
- **ML Model Metrics**: 66.91% Accuracy, 69.83% Precision, 83.25% Recall, 0.6808 ROC-AUC

---

## 📁 Repository Structure

```
recoverai/
├── docker-compose.yml       # Production Compose orchestrator
├── .env.example             # Secrets and configuration template
├── README.md                # Project documentation
├── docs/                    # Technical architecture & pitch docs
│   ├── architecture.md      # Detailed system & LangGraph Mermaid diagrams
│   ├── api-reference.md     # Complete REST API reference
│   ├── demo-script.md       # Exact 3-minute timed judge click path
│   └── pitch-deck-content.md# Complete pitch presentation slides
├── data/                    # Exported synthetic CSV datasets
│   ├── customers.csv        # 10,000 customers (1.42 MB)
│   ├── payments.csv         # 20,000 transactions (3.04 MB)
│   └── recovery_cases.csv   # 5,000 recovery cases (1.00 MB)
├── backend/                 # FastAPI + Async SQLAlchemy + LangGraph + ML
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── alembic/             # Migration versions
│   └── app/
│       ├── main.py          # FastAPI entrypoint
│       ├── core/            # Config, Security, Logging
│       ├── db/              # Async PostgreSQL session
│       ├── models/          # 7 SQLAlchemy 2.0 ORM models
│       ├── schemas/         # Pydantic schemas
│       ├── api/v1/          # 12 REST API endpoints
│       ├── agents/          # 6-Agent LangGraph StateGraph
│       ├── ml/              # XGBoost training & inference
│       └── integrations/    # Gemini & Razorpay clients
└── frontend/                # Next.js 15 App Router + Tailwind + shadcn/ui
    ├── Dockerfile
    ├── package.json
    ├── app/
    │   ├── page.tsx         # Homepage
    │   ├── dashboard/       # 5 KPI Cards + 5 Recharts
    │   └── cases/           # Case directory + Live AI trigger
    └── components/
        ├── navbar.tsx
        ├── kpi-card.tsx
        ├── case-table.tsx
        ├── case-detail-modal.tsx
        └── charts/          # 5 interactive Recharts components
```

---

## 🧪 Running Verification Tests

Run the complete 12-endpoint API & Multi-Agent verification script:
```bash
python backend/tests/verify_endpoints.py
```
Expected output:
```
[OK] 1. Auth Login: Success -> JWT Token acquired
[OK] 2. Dashboard: Success -> At Risk: INR 18.05M, Recovered: INR 9.60M (55.0%)
[OK] 3. Cases List: Success -> 5,000 total cases
[OK] 4. Case Detail: Success -> Customer profile & timeline verified
[OK] 5. ML Predict: Success -> Real-time probability calculation
[OK] 6. Model Metrics: Success -> Accuracy & Confusion Matrix verified
[OK] 7. AI Message Gen: Success -> Multi-tone copywriting verified
[OK] 8. Razorpay Payment Link: Success -> Test link generated
[OK] 9. LangGraph 6-Agent Flow: Success -> Full pipeline executed
[OK] 10. Customer Sentiment AI: Success -> Churn risk scored
[OK] 11. Smart Retry Timing: Success -> Optimal send window calculated
[OK] 12. Merchant AI Copilot: Success -> Analytical questions answered
[OK] ALL 12 BACKEND ENDPOINTS & BONUS AI MODULES VERIFIED!
```
