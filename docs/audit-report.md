# RecoverAI production-readiness audit — resolved

## Scope

FastAPI (8 routers) + Next.js workbench UI + LangGraph 8-agent pipeline + XGBoost +
PostgreSQL 16, composed via `docker-compose.yml`, one-click deploy via `render.yaml`.

## Findings and resolutions

| # | Finding | Status |
|---|---------|--------|
| 1 | Demo login accepted any email/password | **Fixed.** `POST /api/v1/auth/login` only works with explicit `DEMO_*` credentials and refuses (403) whenever `SUPABASE_URL` is set. Production path is Supabase Google OAuth (`app/api/deps.py`). |
| 2 | UI auto-acquired tokens opaquely | **Fixed.** Token flow lives in `frontend/lib/api-client.ts` (single-flight demo login, one retry on 401). No silent bypass. |
| 3 | Razorpay failures returned fabricated URLs | **Fixed.** `razorpay_client` raises 503/502; agent records `payment_link_failed` and continues link-less. Every email carries a freshly minted live link or an honest pending state. |
| 4 | Sentiment/timing/copilot were non-persistent heuristics | **Fixed.** Persisted to `customer_sentiment`, `recommendations`, `copilot_messages`; case detail serves stored intelligence + payment reconciliation. |
| 5 | Graph had a disconnected edge (`channel_selection` → `payment_retry` missing) | **Fixed.** 8-node linear chain, verified by `tests/verify_endpoints.py` (12/12). |
| 6 | Tracking used a side engine + thread per call (hangs, FK races) | **Fixed.** Persistence runs in the request transaction (`persist_recovery_async`); graph nodes are pure state transitions. |
| 7 | Dashboard full-table scans, no tenant predicate | **Partial.** Read-only demo runs single-tenant; `003_dashboard_indexes` covers the hot paths. Redis limiter + RLS remain for multi-tenant production (see `infra/README.md`). |
| 8 | `infra/` was a placeholder | **Fixed.** Prod compose overlay, nginx TLS stub, Render blueprint, CI verify workflow. |

## Residual risks (demo-accepted)

- Default `JWT_SECRET` and demo merchant password are placeholders — rotate before any public deploy.
- Razorpay/Gmail integrations require the operator's own test keys (`RAZORPAY_*`, `SMTP_*`); endpoints 503 honestly without them.
- In-process rate limiter is single-replica only.
