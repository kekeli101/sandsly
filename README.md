# Sandsly

Sandsly is a mobile-first restaurant ordering platform for **The Crunch Bite**, built for Ghanaian customers, kitchen staff, and administrators. The product supports a live catalog, Ghana Cedi pricing, password authentication, persistent carts, pickup and delivery checkout, payment-state records, tracked order timelines, role-protected operations, automatic Kitchen Board polling, operational reporting, and Telegram notifications for new orders.

> **Current deployment:** Vercel serves the React storefront, Render serves the Express/tRPC API, and Supabase provides PostgreSQL persistence.

## Product capabilities

| Area | Current behavior |
| --- | --- |
| Storefront | Responsive Home, searchable Menu, Cart, Profile, Rewards placeholder, and order-tracking routes |
| Catalog | Boba, Yogurt, Ice Cream, Pizza, Fries, and Pork categories with active products, hosted food imagery, and staff device-image uploads |
| Currency | All prices, delivery fees, totals, and notifications use Ghana cedis (`GH₵`) |
| Customer accounts | Local email/password registration and sign-in with signed HTTP-only sessions |
| Cart and checkout | Database-backed cart, quantity changes, pickup/delivery selection, delivery validation, notes, payment-method selection, and payment-state records |
| Customer tracking | Live-refreshing Profile order cards with item details, payment state, fulfillment type, and a status timeline |
| Kitchen Board | Kitchen/Admin-only access with Active and Finished tabs, pickup/delivery-aware status transitions, payment context, delivery details, and five-second polling |
| Admin dashboard | Admin-only `/admin` reporting for order totals, active/finished counts, completed sales, customer count, popular dishes, and recent orders |
| Telegram | Successful checkouts are formatted and sent to the configured Telegram group through the official Bot API |
| Performance | Compressed product photography, native lazy loading, catalog caching, and route-level JavaScript splitting |

## Architecture

```text
React 19 + Vite + Tailwind 4 storefront
                |
                | same-origin /api/trpc proxy in production
                v
Express 4 + tRPC 11 API on Render
                |
                v
Drizzle ORM + PostgreSQL on Supabase
                |
                +--> Supabase Storage for staff-uploaded menu images
                +--> Telegram Bot API for new-order notifications
```

The frontend uses React Query through tRPC. Public catalog reads use a short freshness window so staff availability changes reach customer storefronts quickly. Product cards load images lazily and asynchronously, while the Home hero is prioritized. The expanded-menu images are compressed hosted assets rather than repository files.

## Repository layout

```text
client/
  src/
    components/       Shared application and UI components
    contexts/         Theme and server-backed cart state
    pages/            Home, Menu, Cart, Account, Kitchen, and placeholder routes
    _core/hooks/      Authentication hook
    lib/              tRPC client and catalog types/fallback data
server/
  _core/              Express, tRPC, cookies, and runtime plumbing
  routers/            Auth, storefront, kitchen, catalog, and admin procedures
  db.ts               Supabase/Postgres queries and catalog cache
  telegram.ts         Server-only Telegram Bot API notifier
drizzle/
  schema.ts           PostgreSQL-compatible Drizzle schema
supabase/
  seed.sql            Idempotent category and product catalog seed
  migrations/         Database migration history
scripts/
  seed-supabase.mjs   Applies the catalog seed to Supabase
  apply-supabase-migration.mjs  Applies a reviewed production migration to Supabase
render.yaml           Render API service configuration
vercel.json           Vercel frontend build and same-origin API rewrite
STANDALONE_SETUP.md   Detailed external deployment notes
todo.md              Feature and verification history
verification-*.md    Performance and integration verification records
```

## Requirements

Use Node.js 22 or a compatible current Node.js release, pnpm, a PostgreSQL-compatible Supabase database, and a Telegram bot only if group notifications are required. The repository includes a `pnpm-lock.yaml`; use the frozen lockfile in CI and Render deployments.

## Local development

Install dependencies and start the full-stack development server:

```bash
pnpm install
pnpm dev
```

The local app is served by the Express/Vite development process. Open the URL printed by the server. The API uses `/api/trpc`, and local development can point the frontend at a separate API with `VITE_API_URL` when required.

Create a local environment file only for development. Never commit it:

```dotenv
NODE_ENV=development
JWT_SECRET=replace-with-a-long-random-development-secret
SUPABASE_DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
FRONTEND_ORIGIN=http://localhost:3000
TELEGRAM_BOT_TOKEN=<optional-bot-token>
TELEGRAM_CHAT_ID=<optional-group-chat-id>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key-for-menu-image-uploads>
VITE_API_URL=
```

The application falls back to `DATABASE_URL` in a few database helpers for compatibility, but the standalone deployment should use `SUPABASE_DATABASE_URL` consistently.

## Database setup and catalog seeding

The schema is defined in `drizzle/schema.ts` and the production database is PostgreSQL on Supabase. Apply migrations from a trusted environment after reviewing the generated SQL. Do not commit connection strings or passwords.

To reseed the active catalog idempotently:

```bash
SUPABASE_DATABASE_URL='postgresql://postgres:<password>@<host>:5432/postgres' \
  node scripts/seed-supabase.mjs
```

The seed creates or updates the six product categories and the active catalog entries, including image URLs and Ghana Cedi prices. It is safe to rerun for catalog synchronization. Use the Supabase connection string supplied by the project owner and keep SSL requirements enabled according to the Supabase connection settings.

## Authentication and roles

Sandsly uses local email/password authentication with signed sessions. Passwords are stored as application-generated scrypt hashes; plaintext passwords must never be committed or placed in deployment manifests.

| Role | Access |
| --- | --- |
| `user` | Storefront, cart, checkout, profile, and personal order tracking |
| `kitchen` | All customer features plus the Kitchen Board and staff menu management |
| `admin` | All customer features plus the Kitchen Board, menu management, and the `/admin` reporting dashboard |

Public registration creates customer accounts with the `user` role. Provision kitchen accounts through an authorized database administration process. Staff sign in at `/profile`; the Profile page exposes **Open Kitchen Board** only for Kitchen/Admin roles, and `/kitchen` enforces the same server-side restriction.

The canonical staff account used in verification is `kitchen@mail.com`. Rotate its password before production use and never store credentials in source control.

Email-based password recovery is intentionally deferred until Sandsly has a verified transactional email sender and a production From address. A future reset flow must send single-use, expiring links and return the same confirmation response whether or not an account exists for the requested email.

## Kitchen Board

The Kitchen Board is available at `/kitchen` to authenticated Kitchen and Admin accounts. It separates orders into **Active** and **Completed** tabs. Active orders can move through the valid workflow:

```text
Pickup: Pending → Accepted → Preparing → Ready → Completed

Delivery: Pending → Accepted → Preparing → Ready → Out for Delivery → Delivered
```

The board polls every five seconds and refreshes when the browser regains focus. Finished orders are read-only. Status validation and immutable status-history writes are enforced in the API rather than only in the UI.

The same staff console now includes **Manage menu**. Kitchen/Admin users can add a product, edit its category, name, description, Ghana Cedi price, badge, crunch level, and sort order, and remove or restore products from the customer-facing menu. Menu photography is selected from the staff member’s device rather than entered as a URL. The API accepts only JPEG, PNG, and WebP files up to 5 MB, validates their file signatures, uploads them to the Supabase Storage `menu-images` bucket, and stores the resulting public object URL on the product. Upload access is restricted to Kitchen/Admin server procedures; the Supabase service-role key never reaches the browser. Removal is implemented as a soft deactivation so existing order history keeps its product snapshots. Customer catalog reads exclude inactive products, and catalog caches are invalidated after staff changes with a short freshness window for other storefront sessions.

## Telegram order notifications

After a successful checkout, the API formats a message containing the order number, customer name, fulfillment type, line items, quantities, subtotal, delivery fee, total, payment method/state, necessary delivery details, status, and optional customer note. It sends the message to the configured group through Telegram’s `sendMessage` endpoint.

Telegram delivery is intentionally non-blocking: if Telegram is unavailable, the customer order remains saved and checkout still succeeds. Delivery failures are logged server-side for diagnosis.

Configure these values **only on the API server**:

| Variable | Purpose | Required |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Token issued by BotFather for the Sandsly bot | Required for notifications |
| `TELEGRAM_CHAT_ID` | Destination Telegram group or chat ID | Required for notifications |

Do not place either value in `VITE_*` variables, frontend code, Git history, screenshots, or README files. After adding the bot to the group, ensure it has permission to send messages. The credential check in `server/telegram.credentials.test.ts` validates the bot through Telegram’s `getMe` endpoint.

## External deployment

### Supabase

Create or use a Supabase PostgreSQL project, obtain its connection string, and apply the reviewed migrations. Seed the catalog with `scripts/seed-supabase.mjs`. The database stores users, categories, products, carts, cart items, orders, order items, payments, delivery details, and append-only order-status history.

### Render API

Create a Node web service from the repository using `render.yaml` or equivalent dashboard settings.

| Setting | Value |
| --- | --- |
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Start command | `pnpm start` |
| Health check | `/healthz` |
| Runtime | Node |

Configure the following Render environment variables:

```text
NODE_ENV=production
JWT_SECRET=<long-random-session-secret>
SUPABASE_DATABASE_URL=<Supabase PostgreSQL connection string>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-key-for-menu-image-storage>
FRONTEND_ORIGIN=https://sandsly.vercel.app
TELEGRAM_BOT_TOKEN=<Telegram bot token>
TELEGRAM_CHAT_ID=<Telegram group ID>
```

Render supplies `PORT` automatically. Do not hardcode a port. The API must run over HTTPS in production because the session cookie uses cross-site `SameSite=None; Secure` behavior for the Vercel-to-Render split.

### Vercel frontend

Create a Vercel project from the repository using `vercel.json`.

| Setting | Value |
| --- | --- |
| Build command | `pnpm build:client` |
| Output directory | `dist/public` |
| API routing | Same-origin `/api/*` rewrite to the Render API |

Production frontend requests use the same-origin proxy configured in `vercel.json`, which helps preserve HTTP-only session-cookie behavior. For local development against a remote API, set `VITE_API_URL` to the API base URL; production builds use the same-origin path.

After deployment, verify the following in order:

1. `https://<render-host>/healthz` returns a healthy response.
2. Vercel can load the Home and Menu routes.
3. A customer can register, sign in, add an item, and place an order.
4. The order appears in the Kitchen Board without a manual refresh.
5. Test both pickup and delivery checkout, including delivery contact/address validation and the stored payment method/state.
6. The order transitions through the correct pickup or delivery workflow and appears read-only when finished.
7. The customer Profile renders order status history, item details, fulfillment type, and payment state.
8. Kitchen/Admin staff can select a JPEG, PNG, or WebP image from their device in **Manage menu**, save the item, and see the image in the customer catalog.
9. The Telegram group receives the order number, items, total, fulfillment type, payment state, and required delivery details.

See [`STANDALONE_SETUP.md`](./STANDALONE_SETUP.md) for migration and deployment details already used for the external release.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server with Vite and Express |
| `pnpm check` | Run the TypeScript compiler without emitting files |
| `pnpm test` | Run the complete Vitest suite |
| `pnpm build:client` | Build the Vercel frontend bundle |
| `pnpm build` | Build the client and bundled production API |
| `pnpm start` | Start the production API/server bundle |
| `node scripts/seed-supabase.mjs` | Apply the idempotent catalog seed |
| `node scripts/apply-supabase-migration.mjs supabase/migrations/<file>.sql` | Apply one reviewed migration to the external Supabase database |

The automated suite covers authentication logout, role access, customer catalog visibility, pickup and delivery kitchen transitions, storefront checkout, Supabase database and Storage connectivity, Kitchen-only menu image uploads and image-type validation, Telegram credentials, and Telegram message formatting/delivery.

## Performance practices

The performance pass measured the live Vercel shell, catalog API, Render health endpoint, image payloads, and JavaScript bundle. The largest frontend issue was oversized generated food photography: the six expanded images were approximately 4.5–5.5 MB each. They were resized to 800×1000 JPEGs between approximately 93 and 155 KB.

The client now uses native `loading="lazy"` and `decoding="async"` for product images, prioritizes only the Home hero, caches catalog queries for five minutes, and lazy-loads route pages. The initial JavaScript bundle decreased from approximately 791 kB minified to 636 kB minified, with Home, Menu, Cart, Account, and Kitchen Dashboard emitted as separate route chunks.

Render may still show cold-start latency on autoscaling/free hosting. If low-latency kitchen operations are required at all times, use an always-on service tier or an equivalent warm API deployment.

## GitHub workflow

The repository has two remotes: the managed project remote (`origin`) and the user’s GitHub repository (`user_github`). The local repository is configured with:

```text
git user.name  = Kekeli
git user.email = 149305755+kekeli101@users.noreply.github.com
remote.pushDefault = user_github
```

Future local commits can therefore be attributed to the connected GitHub profile when the commit email remains verified on GitHub, and ordinary pushes target the user-owned GitHub repository by default:

```bash
git status
git add <files>
git commit -m "Describe the change"
git push
```

Existing history is not rewritten by this configuration. Managed checkpoints may also synchronize project state through the platform workflow; inspect `git remote -v` before manually pushing if both remotes have diverged.

## Security notes

Never commit `.env` files, database connection strings, Telegram tokens, session secrets, customer passwords, password hashes, or private deployment URLs containing credentials. Rotate any credential that has been pasted into an unsafe location. Keep Telegram credentials on the Render API only. Use HTTPS in all production environments and review database migration SQL before applying it to Supabase.

## Verification records

The repository contains supporting records for the completed release:

- [`STANDALONE_SETUP.md`](./STANDALONE_SETUP.md) documents the independent deployment sequence.
- [`verification-expanded-menu.md`](./verification-expanded-menu.md) records expanded catalog and image verification.
- [`verification-telegram.md`](./verification-telegram.md) records deployed Telegram order-notification verification.
- [`verification-performance.md`](./verification-performance.md) records measured baseline and optimization results.
- [`todo.md`](./todo.md) preserves the implementation and verification history.
