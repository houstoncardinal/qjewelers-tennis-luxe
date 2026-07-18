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
- `ADMIN_PIN`
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

Do not upload `.env` to the repository or include it in a Netlify deploy. When
rotating a credential, update Netlify first, redeploy, verify the integration,
and then revoke the old credential.
