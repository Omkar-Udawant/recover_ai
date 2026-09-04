# Infrastructure Configurations

- `docker-compose.prod.yml`: production overlay (2 backend replicas, no source bind-mounts, one-shot `migrate` profile job). Run migrations once as a release job, not per replica.
- `nginx.conf`: TLS-terminating reverse proxy stub. Frontend at `/`, API at `/api/`, raw-body passthrough for `/api/v1/webhooks/razorpay`.
- `../.github/workflows/verify.yml`: CI running backend compile+tests and frontend typecheck.

Production checklist (see `../docs/deployment.md`):
1. Managed Postgres with backups; `DATABASE_URL` from secret store.
2. Unique `JWT_SECRET`; Supabase Google OAuth; Razorpay test keys + webhook secret; webhook subscribed to `payment_link.paid|partially_paid|expired`.
3. `BACKEND_CORS_ORIGINS` = public frontend origin only.
4. Multi-replica: replace in-process rate limiter (`backend/app/main.py`) with Redis; add OTEL/metrics export at platform layer.
