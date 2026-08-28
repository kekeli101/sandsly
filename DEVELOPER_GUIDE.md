# The Crunch Bite developer guide

This guide explains how to understand, run, change, test, and deploy the restaurant application. It is written for a developer who is new to this codebase. The repository folder and internal project identifier are `sandsly`; the public restaurant brand is **The Crunch Bite**.

> **Important:** This application handles customer information, restaurant orders, payment state, inventory records, and staff permissions. Make small changes, test them, and never use production data as a playground.

## 1. What the software does

The Crunch Bite is a mobile-first ordering system for Ghanaian customers. Customers browse six categories—Boba, Yogurt, Ice Cream, Pizza, Fries, and Pork—see Ghana Cedi prices, add items to a database-backed cart, choose pickup or delivery, and review their order history. Staff use the Kitchen Board to process orders. Administrators use the Manager Console to review operations, menu health, payments, inventory, recipe costs, expenses, and guarded profit reporting.

The production split is deliberate:

| Service | Responsibility | Production location |
| --- | --- | --- |
| Vercel | React/Vite storefront and static assets | `https://sandsly.vercel.app` |
| Render | Express API, tRPC procedures, authentication, Telegram, Paystack server calls | `https://sandsly.onrender.com` |
| Supabase | PostgreSQL database and `menu-images` object storage | Project-owned Supabase instance |
| Telegram | Restaurant-group order notifications | Client-owned bot and group |
| Paystack | Hosted Card/Mobile Money checkout and signed webhook events | **Test Mode is intentionally retained** in this release |
| Resend | Password-recovery email delivery | Restricted onboarding sender until a custom domain is verified |

## 2. How a request travels through the system

The browser renders a page from Vercel. React Query and the tRPC client send typed requests to the API. In production, the client targets the Render API directly and includes a short-lived Bearer credential after successful local authentication. The API validates the caller, runs a tRPC procedure, and calls the database helpers in `server/db.ts`. Database writes are performed through Drizzle and PostgreSQL. The API then returns a typed result to the browser.

A cash checkout creates the order, records its payment method and state, and sends a Telegram notification without making Telegram availability a prerequisite for storing the order. An online checkout creates a pending order, initializes hosted Paystack checkout, and does not expose the order to Kitchen or Telegram until server-side verification records a successful payment. Paystack’s signed webhook is an independent path for customers who close the browser; the return route and webhook use an idempotent transition so the order is released once.

## 3. Repository map

| Path | What belongs there |
| --- | --- |
| `client/src/App.tsx` | Route registration, lazy page loading, providers, and the shared error boundary. |
| `client/src/components/AppShell.tsx` | Customer shell, navigation, mobile drawer, cart action, and route-intent preloading. |
| `client/src/components/DashboardLayout.tsx` | Shared staff layout and role-aware staff entry behavior. |
| `client/src/pages/Home.tsx` | Public landing page and category entry points. |
| `client/src/pages/Menu.tsx` | Global menu search, categories, product cards, and add-to-bag actions. |
| `client/src/pages/Cart.tsx` | Cart editing, pickup/delivery checkout, and payment selection. |
| `client/src/pages/Account.tsx` | Sign-in, registration, profile editing, order history, staff entry, and recovery request. |
| `client/src/pages/KitchenDashboard.tsx` | Active/Finished Kitchen Board, status transitions, and menu management. |
| `client/src/pages/AdminDashboard.tsx` | Admin-only Manager Console and financial controls. |
| `client/src/contexts/CartContext.tsx` | Cart query state, optimistic updates, and authoritative mutation reconciliation. |
| `client/src/lib/` | Small tested policies such as route preload, menu filter, cart lifecycle, and active-order refresh. |
| `server/routers/` | Thin tRPC contracts. Keep validation and authorization close to the procedure. |
| `server/db.ts` | Database queries and transactional business helpers. |
| `server/standalone-auth.ts` | Local password authentication, signed sessions, and bounded API credentials. |
| `server/paystack.ts` | Server-only payment initialization and verification. |
| `server/paystack-webhook.ts` | Raw-body signature verification and idempotent success handling. |
| `server/telegram.ts` | Server-only Telegram formatting and delivery. |
| `server/_core/` | Express, tRPC context, environment loading, Vite integration, cookies, and storage helpers. Change infrastructure carefully. |
| `drizzle/schema.ts` | PostgreSQL-compatible database schema and inferred types. |
| `supabase/migrations/` | Reviewed SQL migrations for the external Supabase database. |
| `scripts/` | Trusted operational scripts such as catalog seeding and reviewed migration application. |
| `server/*.test.ts` and `server/*.test.tsx` | Vitest and JSDOM regression coverage. |
| `README.md`, `STANDALONE_SETUP.md`, `FINAL_READINESS.md` | Project, deployment, and launch-readiness records. |

## 4. Local setup

Use Node.js 22 or a compatible current Node.js release and pnpm. From the repository root:

```bash
pnpm install
pnpm dev
```

Open the URL printed by the development server. The full-stack development command starts Express and Vite together. For a separate API during development, set `VITE_API_URL` to the API base URL. Leave it blank when using the local combined server or the production default.

Create a local `.env` file only on your own machine. Never commit it. The minimum database/auth setup is:

```dotenv
NODE_ENV=development
JWT_SECRET=<long-random-development-secret>
SUPABASE_DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-storage-key>
FRONTEND_ORIGIN=http://localhost:3000
```

Optional integrations use `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `PASSWORD_RESET_TEST_RECIPIENT`, and `PAYSTACK_SECRET_KEY`. Keep every integration secret on the API side. The Paystack secret must remain a Test Mode key for this release. Do not add secrets to Vercel frontend variables unless the value is intentionally public.

## 5. Useful commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the local Express/Vite development server. |
| `pnpm check` | Run TypeScript without emitting files. |
| `pnpm test` | Run the full Vitest suite. |
| `pnpm vitest run server/<file>` | Run one focused test file or group. |
| `pnpm build:client` | Build the Vercel frontend. |
| `pnpm build` | Build the frontend and bundled production API. |
| `pnpm start` | Start the compiled production server. |
| `pnpm format` | Format repository files with Prettier. |
| `node scripts/seed-supabase.mjs` | Idempotently synchronize the approved catalog. |
| `node scripts/apply-supabase-migration.mjs <file>` | Apply one reviewed SQL migration to Supabase. |

The safe contribution loop is: understand the affected flow, write or update a test, make the smallest code change, run `pnpm check`, run focused tests, run `pnpm test`, run `pnpm build`, review the mobile UI, then update documentation and the checklist.

## 6. Authentication and roles

Public registration always creates a `user` role. A successful local sign-in, registration, or password reset sets the normal signed HTTP-only session cookie and returns a signed access credential with a 12-hour lifetime. The browser keeps that credential only in `sessionStorage`; it is sent as `Authorization: Bearer ...` to the API and cleared at logout. The API verifies the signature, expiration, and current user record on every protected request.

| Role | Allowed capabilities |
| --- | --- |
| `user` | Browse, cart, checkout, profile, and personal order history. |
| `kitchen` | Customer capabilities plus Kitchen Board and menu management. No Manager Console. |
| `admin` | Customer capabilities plus Kitchen Board, menu management, and Manager Console. |

The UI hides staff actions for ordinary customers, but that is not security. Server procedures use role checks. When adding a protected procedure, use `protectedProcedure` or `adminProcedure` in the server router and add a test for both an allowed role and a rejected role.

Staff accounts must be provisioned by an authorized owner/database process. Never place a staff password, password hash, or API token in Git, a screenshot, a ticket, or this guide.

## 7. Data model and order lifecycle

The schema uses integer pesewas for money and UTC-based timestamps. Order items preserve product name and price snapshots so a later catalog price change does not rewrite historical orders. Orders also keep fulfillment type, payment method/state, delivery details where applicable, and append-only status history.

The pickup flow is:

```text
pending → accepted → preparing → ready → completed
```

The delivery flow is:

```text
pending → accepted → preparing → ready → out_for_delivery → delivered
```

The Kitchen API validates transitions. The browser cannot skip a state by changing a button or request payload. When a menu item is deactivated, it is soft-deleted from the customer catalog so historical order snapshots remain readable.

## 8. Catalog and menu management

Customer catalog reads return active products grouped by the six seeded categories. `Menu.tsx` applies a global text filter before category filtering, so the default All tab searches every live dish. Product image uploads are restricted to JPEG, PNG, and WebP, limited to 5 MB, checked by file signature, uploaded to Supabase Storage, and stored as an object URL. Do not use the Render filesystem for persistent uploads.

When changing catalog fields, consider three audiences: customers need clear names and prices, Kitchen needs useful preparation details, and reports need stable product/order snapshots. Do not edit historical order snapshots to make current menu copy look consistent.

## 9. Cart and checkout rules

Cart actions are optimistic: the interface updates immediately, then the mutation persists the change. The final successful mutation response is used as the authoritative reconciliation snapshot, avoiding an unnecessary extra cart read. Failed mutations roll back the affected state and reconcile with the server. In-flight stale reads must not overwrite a newer optimistic quantity.

Checkout validates customer details and delivery fields on the server. The server calculates the order total from stored product prices and integer fees; never trust a browser-submitted total. The UI prevents duplicate submission and provides a recovery path when a request fails.

New orders receive a predictable Ghana-local daily sequence in the format `CB-YYYYMMDD-NNN`, for example `CB-20260828-001`. The date is calculated in `Africa/Accra`, and the sequence starts at `001` for each calendar day. Existing order numbers are preserved for history compatibility. The database uniqueness constraint remains authoritative, and checkout retries a rare order-number collision inside the transaction rather than returning a duplicate.

Cash orders may notify Telegram after the order is stored. Online Card/Mobile Money orders remain pending until Paystack independently verifies the exact reference, GHS currency, amount, and successful status. Do not loosen this rule for faster UI feedback.

## 10. Kitchen operations

Kitchen Board data polls every five seconds and refreshes on focus. Status changes are shown optimistically, but the server response remains authoritative. If a status mutation fails, the board rolls back and reports the error. Loading states must not display zero counts as if there are no orders; use the explicit loading presentation instead.

If the API is slow or unavailable, an order already stored in the database must not disappear from the interface silently. The current release does not promise offline processing or a durable notification queue. Those would be separate features requiring a design and failure-mode review.

## 11. Manager Console and profit reporting

The Manager Console is available only to `admin`. It reports fulfilled sales, provider-verified online collection, cash awaiting reconciliation, menu performance, payment state, inventory, recipe costs, recorded waste, operating expenses, and guarded profit metrics.

A margin is complete only when fulfilled order lines have immutable recipe-cost snapshots. Older sales without captured costs remain partial rather than being represented as profitable. Supplier restocks belong to inventory movement; rent, utilities, payroll, marketing, delivery, maintenance, and other overhead belong to operating expenses. Do not record one supplier purchase in both places.

The Manager Console’s financial figures are operational accounting aids, not a substitute for bookkeeping, tax records, bank reconciliation, or professional accounting review. When adding a new metric, document its inclusion rules, time period, status filters, currency unit, and whether it can be incomplete.

## 12. Paystack status for this release

Paystack remains **Test Mode** by deliberate release decision. The server secret is expected to use the `sk_test_` prefix. The webhook endpoint is:

```text
POST https://sandsly.onrender.com/api/paystack/webhook
```

The endpoint validates the raw-body `x-paystack-signature` HMAC-SHA512, verifies the transaction independently, compares reference/currency/amount, and performs an idempotent pending-to-successful update. Never put the secret in frontend code or documentation. A future live release must be treated as a separate change: complete merchant onboarding, configure account security, obtain a live secret through a secret manager, configure the live webhook, review support/refund/reconciliation procedures, and perform an explicitly approved real-money acceptance test. Consult [Paystack Authentication][1], [Paystack Webhooks][2], and [Paystack Verify Payments][3].

## 13. Telegram and email operations

Telegram notifications are server-only. Cash notifications happen after a stored order; online notifications happen only after verified payment. Telegram failure is non-blocking to checkout and is logged server-side. The current release does not provide a durable retry queue, so repeated delivery failures need operational attention.

Password recovery is non-enumerating and token-based. Until a custom Resend sending domain is verified, delivery is restricted to the configured testing recipient. Do not advertise public password recovery until the domain, sender, and delivery test are complete.

## 14. Deployment

### Supabase

Create the PostgreSQL database, review every generated migration, and apply only approved SQL from a trusted environment. Keep SSL enabled according to the Supabase connection settings. Configure Supabase Storage and confirm the `menu-images` bucket is available for staff upload. Backups and restoration ownership must be agreed with the client.

### Render

Use `render.yaml` or equivalent settings:

```text
Build: pnpm install --frozen-lockfile && pnpm build
Start: pnpm start
Health: /healthz
```

Set `NODE_ENV=production`, `JWT_SECRET`, `SUPABASE_DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_ORIGIN`, Telegram variables, Resend variables, and the current Test Mode Paystack secret. Render supplies `PORT`; never hardcode it. Use HTTPS and forward `X-Forwarded-Proto` through any proxy.

### Vercel

Use the repository’s `vercel.json`, the `pnpm build:client` build command, and `dist/public` output directory. Point `VITE_API_URL` at the Render API when an explicit override is necessary; production code has a deployed Render fallback. Verify that missing hashed assets return 404 rather than the application HTML shell. Keep secrets off Vercel.

After deployment, check `/healthz`, Home, Menu, Profile, `/kitchen`, and `/admin` with appropriate accounts. Do not create a real customer order or payment during an ordinary deployment check. Use a separate staging database and Test Mode for end-to-end destructive or transactional tests.

## 15. Testing strategy

Tests are written with Vitest. Server procedure tests use mocked contexts and database dependencies. Rendered page tests use JSDOM, Testing Library, and user-event. Small policy tests cover cart reconciliation, menu filtering, route preloading, order polling, lazy-import recovery, and finance calculations.

At minimum, a change should cover:

| Change | Required regression coverage |
| --- | --- |
| New protected procedure | Allowed role, rejected role, invalid input, and safe error behavior. |
| Money or payment logic | Integer arithmetic, currency/reference checks, duplicates, failure path, and no secret leakage. |
| Cart or checkout | Immediate feedback, duplicate submission, stale query race, rollback, and final authoritative state. |
| Kitchen workflow | Valid transition, invalid transition, loading/error state, and persistence after refresh. |
| Menu/catalog | Global search/category behavior, active/inactive visibility, price snapshot preservation, and image validation if applicable. |
| Manager metric | Inclusion rules, incomplete-data boundary, currency display, and rendered empty state. |
| Navigation/accessibility | Direct route, mobile route, keyboard focus, accessible name, and denied role. |

Run `pnpm check`, `pnpm test`, and `pnpm build` before opening a release checkpoint. A screenshot is useful for visual review but does not replace unit or rendered tests.

## 16. Troubleshooting

**The site loads but API data is slow.** Check Render `/healthz` and the Render runtime logs. Autoscaling can cause cold starts. Confirm `VITE_API_URL` is not an empty override and that `FRONTEND_ORIGIN` matches the production storefront.

**A user sees a protected gate.** Confirm they signed in during the current browser session. Check that the browser has not cleared `sessionStorage`, then inspect the user’s database role. Do not bypass the server role check.

**Kitchen shows no orders.** Check whether the data query is still loading, whether the API is healthy, whether the orders are in a Kitchen-visible payment/status state, and whether the account has `kitchen` or `admin` role. Do not create a fake order to debug production.

**An online order is not in Kitchen.** Confirm Paystack verification recorded successful status, exact amount, GHS currency, and matching reference. A pending, failed, abandoned, reversed, or mismatched transaction must remain out of Kitchen.

**Telegram did not receive a message.** Confirm the API-only bot variables, group membership, permission to send messages, and server logs. The order should still remain stored. Never paste the token into a ticket or test output.

**Password recovery does not arrive.** Confirm the restricted testing recipient, Resend sender configuration, API logs, and whether a custom domain has been verified. Do not weaken the generic acknowledgement or token expiry.

**A stale browser breaks after deployment.** The application’s lazy-import recovery offers a controlled refresh path, and Vercel does not rewrite missing `/assets/` files to HTML. First retry after a hard refresh; then inspect the active asset manifest and deployment.

## 17. Safe contribution rules

Keep public brand copy as **The Crunch Bite**. Keep `sandsly` as the repository/internal identifier unless a deployment migration is intentionally planned. Preserve Ghana Cedi formatting and integer pesewa calculations. Never fabricate customer reviews, ratings, testimonials, orders, payments, inventory, expenses, or financial results.

Use migrations for schema changes. Review generated SQL before applying it to Supabase. Do not make destructive database changes from a local experiment. Add a rollback or recovery plan for changes touching orders, payments, roles, inventory, or storage. Keep new routers thin and move reusable queries into `server/db.ts` or a focused helper.

Before publishing, review `todo.md`, update the relevant verification record, confirm no secret-bearing temporary script remains, run the full checks, and save a checkpoint. Deployment checkpoints are release events because this project is configured for automatic publication.

## 18. Ownership and handover

The client should own or control the Vercel project, Render service, Supabase project, domain, Paystack account, Telegram bot/group, Resend account, and GitHub repository. Credentials should be exchanged through a password manager. The client should receive the public URL, staff/admin URLs, basic operating instructions, backup/recovery ownership, and a written list of deferred capabilities.

For a future developer, begin with this guide, then read `README.md`, `STANDALONE_SETUP.md`, `FINAL_READINESS.md`, `verification-*.md`, and the focused tests for the area being changed. Treat the tests and verification records as executable history: they explain not only what the code does, but which failure modes the project has already encountered.

## References

[1]: https://paystack.com/docs/api/authentication/ "Paystack Authentication"
[2]: https://paystack.com/docs/payments/webhooks/ "Paystack Webhooks"
[3]: https://paystack.com/docs/payments/verify-payments/ "Paystack Verify Payments"
