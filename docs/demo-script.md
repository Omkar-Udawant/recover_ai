# RecoverAI — Live Demo Script (3 Minutes)

This script guarantees a winning hackathon demonstration by presenting a clear problem hook, live data proof, real-time AI decision loop, and verifiable financial ROI.

---

## ⏱️ Timeline & Click-Through Path

### Part 1: Problem Hook & ROI Proof (0:00 – 0:45)
1. **Open the Dashboard**: Navigate to [`http://localhost:3000/dashboard`](http://localhost:3000/dashboard).
2. **Present the Numbers**:
   > *"Businesses lose over 10% of recurring revenue to failed payments, card expirations, and abandoned checkouts. RecoverAI turns this lost revenue into an automated recovery engine."*
3. **Show Live KPI Cards**:
   - Point to **₹18.05M Revenue At Risk** vs. **₹9.60M Won Back** (**55.0% Recovery Rate**).
   - Point to **21.3x Estimated ROI**.
4. **Highlight the Visual Charts**:
   - Show the **30-Day Recovery Velocity Trend**.
   - Show the **Payment Failure Reasons** breakdown (e.g. `insufficient_funds`, `card_declined`).
   - Show the **Conversion Funnel** (Detection $\rightarrow$ Outreach $\rightarrow$ Link Opened $\rightarrow$ Recovered).

---

### Part 2: Case Inspection & Live Multi-Agent AI Trigger (0:45 – 2:00)
1. **Navigate to Cases**: Click **"Live Cases"** or navigate to [`http://localhost:3000/cases`](http://localhost:3000/cases).
2. **Filter Cases**:
   - Filter by **"High Risk"** or search for a specific customer (e.g., *Yuvraj Edwin*).
3. **Open Case Inspection Dossier**:
   - Click on any case row to open the inspection drawer.
   - Highlight the **Customer Profile** (Tenure, Engagement Score, Past Recoveries).
   - Highlight the **XGBoost ML Prediction** (e.g., *81.5% Recovery Probability*).
4. **Trigger the 8-Agent AI Live**:
    - Select outreach tone: click **"Hinglish"** or **"Friendly"**.
    - Click **"Run Recovery Agent"**.
    - Watch the **LangGraph StateGraph** execute live:
      - **Risk Detection** triages the event.
      - **XGBoost** computes probability.
      - **Sentiment/Churn** + **Recommendation/Timing** persist intelligence.
      - **Gemini** selects channel (e.g., *SMS / WhatsApp*).
      - **Razorpay** mints a real test payment link (`https://rzp.io/i/...`) — if Razorpay is unreachable the run is tracked with no link and an explicit `payment_link_failed` error, never a fabricated link.
      - **Gemini** writes personalized copy with server-interpolated payment links.
      - **PostgreSQL** updates status to `contacted` and logs cases, actions, predictions, recommendations, sentiment, agent executions, and audit trail.
5. **Open Payment Link**: If a real link was minted, click **"Open Link"** or **"Copy"** to demonstrate test payment capability. If no link exists, show the tracked error state.

---

### Part 3: Classical ML Metrics & Architecture Close (2:00 – 3:00)
1. **Show FastAPI Swagger Docs**: Open [`http://localhost:8000/docs`](http://localhost:8000/docs).
2. **Execute `GET /api/v1/metrics`**:
   - Show judges the real XGBoost confusion matrix ($\text{TP}=507$, $\text{FP}=219$, $\text{TN}=142$, $\text{FN}=102$) and $\text{ROC-AUC}=0.6808$.
   - Highlight that the model learned real statistical signal without fake 99% accuracy.
3. **Summary & Closing**:
   > *"RecoverAI proves that multi-agent AI combined with classical ML delivers immediate, measurable bottom-line revenue recovery for modern SaaS and e-commerce merchants."*
