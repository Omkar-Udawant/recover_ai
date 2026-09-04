# RecoverAI — System Architecture & Multi-Agent Flow

RecoverAI is an autonomous, agentic revenue recovery platform that monitors financial leakage, predicts recovery probabilities with classical ML, and orchestrates personalized multi-channel outreach through a stateful multi-agent LangGraph workflow.

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph Frontend [Next.js 15 App Router]
        UI[SSR Dashboard & Command Center]
        CaseUI[Case Dossier & Live Agent Runner]
        Charts[Interactive Recharts Engine]
    end

    subgraph API_Gateway [FastAPI Gateway :8000]
        Auth[Supabase JWT verification and RBAC]
        DashSvc[Dashboard Aggregation Service]
        CaseSvc[Relational Case Service]
        MLInference[XGBoost Predict Engine]
    end

    subgraph LangGraph_Workflow [LangGraph Revenue Intelligence Pipeline]
        Agent1[1. Risk Detection]
        Agent2[2. ML Recovery Prediction]
        Agent3[3. Sentiment and Churn Analysis]
        Agent4[4. Recommendation and Smart Timing]
        Agent5[5. Gemini Channel Selection]
        Agent6[6. Razorpay Link Minting]
        Agent7[7. Gemini Copywriting]
        Agent8[8. Recovery Tracking]
    end

    subgraph External_Services [AI & Financial Integrations]
        Gemini[Google Gemini API]
        Razorpay[Razorpay Payment Gateway]
    end

    subgraph Database_Layer [Data & Persistence]
        PG[(PostgreSQL 16 Engine)]
        CSVData[Exported CSV Datasets]
    end

    UI -->|REST API + JWT| API_Gateway
    CaseUI -->|POST /api/v1/agent/run| API_Gateway
    API_Gateway --> LangGraph_Workflow
    API_Gateway --> PG

    Agent1 --> Agent2
    Agent2 --> Agent3 --> Agent4 --> Agent5 --> Agent6 --> Agent7 --> Agent8

    Agent5 -.->|Structured Prompt| Gemini
    Agent6 -.->|Real Test Mode Link| Razorpay
    Agent7 -.->|Tone Generation| Gemini
    Agent7 -->|Durable execution record| PG
```

---

## 2. Multi-Agent Finite State Machine

```mermaid
stateDiagram-v2
    [*] --> Pending : Payment Failed / Overdue
    Pending --> RiskAssessed : Agent 1 (Risk Detection)
    RiskAssessed --> ProbEstimated : Agent 2 (XGBoost Prediction)
    ProbEstimated --> SentimentAssessed : Agent 3 (Sentiment / Churn)
    SentimentAssessed --> Recommended : Agent 4 (Channel / Timing / Discount)
    Recommended --> ChannelAssigned : Agent 5 (Gemini Channel Selection)
    ChannelAssigned --> LinkGenerated : Agent 6 (Razorpay Link Creation)
    LinkGenerated --> MessageDrafted : Agent 7 (Gemini Multi-Tone Copy)
    MessageDrafted --> Contacted : Agent 8 (Audit & Tracking)
    Contacted --> LinkOpened : Customer Clicks Link
    LinkOpened --> PaymentAttempted : Customer Enters Details
    PaymentAttempted --> Recovered : Transaction Success
    PaymentAttempted --> Lost : Exceeded Grace Period / Churn
```

---

## 3. Database Entity Relationship Model

```mermaid
erDiagram
    CUSTOMERS ||--o{ PAYMENTS : owns
    CUSTOMERS ||--o{ SUBSCRIPTIONS : maintains
    CUSTOMERS ||--o{ RECOVERY_CASES : targets
    PAYMENTS ||--o{ RECOVERY_CASES : originates
    RECOVERY_CASES ||--o{ RECOVERY_ACTIONS : triggers
    RECOVERY_CASES ||--o{ PREDICTIONS : receives
    RECOVERY_CASES ||--o{ AUDIT_LOGS : records
    RECOVERY_CASES ||--o{ PAYMENT_ATTEMPTS : reconciles
    RECOVERY_CASES ||--o{ RECOMMENDATIONS : receives
    CUSTOMERS ||--o{ CUSTOMER_SENTIMENT : has
    ORGANIZATIONS ||--o{ USERS : contains

    CUSTOMERS {
        uuid id PK
        string name
        string email UK
        string phone
        int tenure_days
        decimal engagement_score
        int previous_successful_recoveries
        datetime created_at
    }

    PAYMENTS {
        uuid id PK
        uuid customer_id FK
        decimal amount
        string currency
        string status
        string failure_reason
        string event_type
        int days_overdue
        datetime created_at
    }

    RECOVERY_CASES {
        uuid id PK
        uuid customer_id FK
        uuid payment_id FK
        string risk_level
        decimal recovery_probability
        string status
        string assigned_channel
        decimal amount
        datetime created_at
        datetime recovered_at
    }
```
