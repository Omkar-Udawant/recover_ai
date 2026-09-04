# Authentication

RecoverAI uses Supabase Auth as the identity provider. Enable **Google** in Supabase Authentication → Providers, configure the Google OAuth client and secret there, and add `http://localhost:3000/auth/callback` plus the production callback URL to Google and Supabase redirect allow-lists.

Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The frontend sends the Supabase access token as a bearer token. The API validates it against Supabase `/auth/v1/user`; an expired or invalid session returns 401. Assign `merchant_admin` or `analyst` in `app_metadata.role` for backend role enforcement. `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never reach the browser.

For local demo compatibility only, if Supabase is not configured, the legacy signed-token path remains available. Production deployments must configure Supabase and disable the legacy `/auth/login` route at the ingress layer.
