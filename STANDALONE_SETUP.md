# Sandsly standalone setup

Sandsly now runs with its own local email/password authentication and signed cookie sessions. The app no longer requires Manus OAuth, Manus Preview headers, Manus storage, Manus analytics, or the managed Vite runtime.

## Required environment variables

```bash
NODE_ENV=development
SUPABASE_DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-supabase-service-role-key>
JWT_SECRET=replace-with-a-long-random-secret
```

`JWT_SECRET` must be a long, random value in production. Sandsly uses PostgreSQL on Supabase. The Drizzle schema and reviewed migrations create the catalog, users, carts, orders, profiles, roles, payments, and order-status history. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are required only when Kitchen/Admin staff upload menu images from a device; keep the service-role key on the API server and out of browser variables.

## Install and run

```bash
pnpm install
pnpm drizzle-kit generate
pnpm dev
```

The production bundle is built with:

```bash
pnpm check
pnpm test
pnpm build
NODE_ENV=production node dist/index.js
```

The server listens on the `PORT` environment variable when provided and otherwise uses the local development default.

## Authentication

Customers register and sign in at `/profile` using email and password. Passwords are hashed with `scrypt`, and sessions are signed with `JWT_SECRET` in an HTTP-only cookie. Kitchen and admin access continues to use the existing database roles. Promote a staff account by updating its `role` to `kitchen` or `admin` through an authorized database administration process.

### Password recovery

The Profile sign-in experience includes an accessible show/hide password control, a non-enumerating recovery request, and a `/reset-password` completion route. Password-reset tokens are random 256-bit values that are persisted only as SHA-256 hashes. They expire after 30 minutes, are single-use, and are invalidated if email delivery fails. Set these **server-only** variables on the API host:

```text
RESEND_API_KEY=<Resend API key>
RESEND_FROM_EMAIL=<authorized sender address>
PASSWORD_RESET_TEST_RECIPIENT=<testing-only recipient>
```

Until a custom domain is verified in Resend, use `RESEND_FROM_EMAIL=onboarding@resend.dev`. In that mode Sandsly deliberately permits reset email delivery only to `PASSWORD_RESET_TEST_RECIPIENT`; requests for other users still receive the same generic acknowledgement and produce no usable reset token. Vercel hosting does not prevent Resend domain verification: DNS records may be managed through a registrar or Vercel DNS while the site remains hosted on Vercel. Before enabling public recovery, verify a domain in Resend, configure a sender on that domain, remove the onboarding sender, and run the Resend credentials test.

### Paystack test checkout

Online Card and Mobile Money choices initialize a hosted **Paystack test** checkout. Set `PAYSTACK_SECRET_KEY` to an `sk_test_...` key only on the API host. Sandsly creates the order first, calculates its GHS amount on the server in pesewas, generates a unique payment reference, and redirects the customer to Paystack. The `/payment/verify?reference=...` return route verifies the reference server-side and marks the payment successful only when Paystack returns `data.status=success`, the stored reference matches, the currency is GHS, and the amount equals the stored order total.

Sandsly also receives `charge.success` events at the public API endpoint:

```text
https://sandsly.onrender.com/api/paystack/webhook
```

Add that URL in the **Paystack test dashboard** developer settings. The endpoint receives the raw JSON body, validates the `x-paystack-signature` HMAC-SHA512 header using the server-only Paystack secret, then independently verifies the transaction with Paystack before recording it. Duplicate deliveries are idempotent: only the first pending-to-successful transition releases the order to Kitchen and sends its Telegram notification. Invalid signatures, malformed payloads, mismatched amount/currency/reference, unknown events, and non-successful verification results cannot mark an order paid. A transient verification/database failure returns a non-2xx response so Paystack retries delivery.

The test rollout deliberately refuses a live `sk_live_...` key. Do not switch to live payments until the Paystack business account, production webhook URL, customer support process, reconciliation workflow, and successful end-to-end test event have been reviewed and explicitly approved.

## External assets and menu uploads

Existing menu photography uses public hosted URLs and the brand mark is a repository-owned SVG at `client/public/brand-mark.svg`. Kitchen/Admin staff can also select a JPEG, PNG, or WebP image from a device (maximum 5 MB) when adding or editing a menu item. The API validates the type and file signature, then persists it in the Supabase Storage `menu-images` bucket. The bucket is created automatically on the first successful upload and only the resulting public object URL is stored with the product. Do not use the Render filesystem for menu uploads because it is ephemeral.

## Deployment

Deploy the Node server and the built `dist` directory to any host that supports Node.js, Express, and PostgreSQL. Configure the same environment variables in the host’s secret manager, enable HTTPS, and use a persistent database. If the deployment is behind a reverse proxy, forward the `X-Forwarded-Proto` header so secure cookie behavior remains correct.

## Scope intentionally removed

The standalone build does not include Manus OAuth, Preview/demo-session headers, Manus Forge integrations, Manus analytics injection, owner notifications, or the Manus-specific Vite runtime/debug collector.

### Provisioning a Kitchen account

Create staff accounts through the authorized database administration process rather than the public registration form, because public registration intentionally creates customer accounts with the `user` role. Store the email in normalized lowercase form, set `loginMethod` to `password`, store a `scrypt$...` password hash generated by the application’s password helper, and assign `role` to `kitchen` or `admin`. Staff sign in at `/profile`; after authentication, the Profile page displays the **Open Kitchen Board** action and `/kitchen` enforces the staff role.

For the configured verification account, use the credentials supplied to the project owner and rotate the password before production use. Never commit plaintext passwords or password hashes to source control.

## Vercel + Render + Supabase deployment

The recommended external split is Vercel for the React/Vite frontend, Render for the Express/tRPC API, and Supabase for Postgres persistence. Vercel should use the repository root with `vercel.json`; its build command is `pnpm build:client`, output directory is `dist/public`, and `VITE_API_URL` must point to the deployed Render API URL, for example `https://sandsly-api.onrender.com`.

Render should create a Node web service from the repository using `render.yaml`, or equivalent dashboard settings. Its build command is `pnpm install --frozen-lockfile && pnpm build`, its start command is `pnpm start`, and its health check is `/healthz`. Configure `NODE_ENV=production`, `JWT_SECRET`, `SUPABASE_DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_ORIGIN`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `PASSWORD_RESET_TEST_RECIPIENT`, and the test-only `PAYSTACK_SECRET_KEY` with the final Vercel production URL. Configure `TELEGRAM_BOT_TOKEN` with the bot token and `TELEGRAM_CHAT_ID` with the destination group ID. Keep the Telegram values, Paystack key, Resend credentials, and Supabase service-role key server-side in Render; never place them in Vercel frontend variables or source control. Render supplies `PORT` automatically. The Paystack webhook URL must point to the publicly reachable Render API, not Vercel or localhost.

Supabase is used as Postgres through Drizzle. The schema is defined in `drizzle/schema.ts`, and reviewed generated migrations are stored in `supabase/migrations/`. For the external Supabase database, review the migration first and apply one file from a trusted environment with `node scripts/apply-supabase-migration.mjs supabase/migrations/<file>.sql`. Do not commit connection strings.

After both services are deployed, set Vercel `VITE_API_URL` to the Render URL, set Render `FRONTEND_ORIGIN` to the Vercel production URL, redeploy both services, and verify `/healthz`, registration, login, pickup and delivery checkout, stored payment method/state, order tracking, Kitchen Board access, finished-order tabs, the Admin dashboard, and a new-order Telegram message in the configured group. Because authentication uses an HTTP-only cross-site cookie in this split deployment, both services must use HTTPS and the Render cookie configuration must remain `SameSite=None; Secure` in production.
