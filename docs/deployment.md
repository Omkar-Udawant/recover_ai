# Deployment

1. Copy `.env.example` to a secret store-backed `.env`; generate a unique JWT secret and never commit it.
2. Configure Supabase Google OAuth and the Razorpay **test-mode** key pair and webhook secret.
3. Set the Razorpay webhook target to `https://api.example.com/api/v1/webhooks/razorpay` and subscribe to `payment_link.paid`, `payment_link.partially_paid`, and `payment_link.expired`.
4. Run `docker compose up -d --build`, then `docker compose exec backend alembic upgrade head`.
5. Terminate TLS at a reverse proxy, restrict CORS to the frontend origin, and use a managed PostgreSQL instance with backups.

For multi-replica API deployment, replace the in-process rate limiter with Redis and add OpenTelemetry/metrics export at the platform layer. Run migrations once as a release job, not per replica.
