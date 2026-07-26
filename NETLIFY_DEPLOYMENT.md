# Secure Netlify deployment

The application does not deploy `.env`. Local `.env` files are ignored by Git;
production configuration belongs in Netlify's encrypted environment variables.

## Required production variables

Set these under **Netlify → Site configuration → Environment variables**:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `ADMIN_BOOTSTRAP_PASSWORD` (temporary: remove after the first successful admin login)
- `ADMIN_SESSION_SECRET`
- `STRIPE_SECRET_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_SITE_URL`

Recommended for transactional email:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Optional integrations are documented in `.env.example`.

Only variables beginning with `VITE_` are compiled into browser code. Never
give a secret variable a `VITE_` prefix. Stripe and Supabase publishable keys
are intentionally public; secret/service-role keys are server-only.

## Deploy

1. Connect the Git repository to Netlify.
2. Netlify reads `netlify.toml`, runs `npm run build:netlify`, and publishes
   `dist/client` with the SSR and webhook functions.
3. Apply all Supabase migrations before enabling checkout.
4. Deploy, then verify the Stripe destination points to:
   `https://qureshijewelers.com/.netlify/functions/stripe-webhook`.
5. Confirm webhook deliveries return HTTP 200.

The `checkout-maintenance` scheduled function runs every five minutes after
deployment. Confirm it appears under Netlify **Functions** and that scheduled
invocations succeed; it expires stale carts and cancels open Stripe intents.

## Launch tests

- `npm test` runs unit and security-contract tests.
- `supabase test db` runs RLS, inventory, promo, and refund concurrency tests
  against an isolated local Supabase stack (Docker Desktop must be running).
- `npm run test:e2e` runs desktop/mobile non-payment checkout tests.
- Real payment scenarios are skipped unless `RUN_PAYMENT_E2E=1` and the
  `E2E_PRODUCT_*` variables point to a seeded isolated test catalog. Only run
  those scenarios with matching `sk_test_` / `pk_test_` Stripe keys and the
  test webhook secret—never with production keys.

## Required credential rotation

Credentials previously exposed in local output or conversation history must be
replaced, not merely moved into `.env`:

1. Rotate the Supabase service-role key and personal access token.
2. Roll the Stripe secret key and webhook signing secret; update the endpoint.
3. Rotate Resend, OpenAI, Firecrawl, and any PayPal credentials.
4. Generate a new `ADMIN_SESSION_SECRET` and bootstrap password.
5. Update Netlify environment variables, redeploy, verify every integration,
   and only then revoke the old values.

Do not upload `.env` to the repository or include it in a Netlify deploy. When
rotating a credential, update Netlify first, redeploy, verify the integration,
and then revoke the old credential.
