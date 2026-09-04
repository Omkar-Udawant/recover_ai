# RecoverAI production-readiness audit

## Existing features

FastAPI provides recovery cases, dashboard aggregations, ML prediction, LangGraph orchestration, Gemini-assisted copy/channel selection, and PostgreSQL persistence. Next.js provides dashboard, case directory, charts, and a case execution modal. Docker Compose runs PostgreSQL, API, and UI.

## Gaps and debt found

The login endpoint issued a token for any supplied email/password, the UI automatically acquired that demo token, and no tenant boundaries existed. Razorpay caught every exception and returned a fabricated URL. Sentiment, timing, and copilot were non-persistent endpoint heuristics. The graph had six nodes only, and the schema lacked payment reconciliation, organizations/users, recommendations, executions, and stored sentiment.

## Security and scalability risks

Default JWT credentials were committed in the example configuration; CORS used broad methods/headers; endpoints had no rate control; webhook verification was absent; and service failures were silently masked. Dashboard queries aggregate entire tables synchronously, with no tenant predicate or materialization. The in-process limiter is intentionally safe for a single container but must be replaced by Redis for horizontally scaled deployments.

## Demo weaknesses

The demo describes mock operations as live integrations, auto-auth hides access control, and charts do not expose intelligence scores, attribution, or payment reconciliation. The implementation adds the key durable and verifiable paths; Redis metrics/tracing exporters remain deployment choices rather than application-owned infrastructure.
