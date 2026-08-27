# The Crunch Bite final launch-readiness record

**Repository identifier:** `sandsly`  
**Public brand:** **The Crunch Bite**  
**Audit basis:** the supplied `RESTAURANT WEB APP — COMPLETE PRE-LAUNCH QA CHECKLIST`, repository inspection, automated tests, and non-destructive production smoke checks.

## Executive decision

The current release is a **non-payment production candidate**, not a full payment-enabled launch approval. The customer storefront, cart, account, Kitchen Board, Manager Console, catalog management, Telegram order notifications, Supabase persistence, and Vercel/Render deployment paths are implemented and have automated or recorded verification evidence. Paystack live activation is intentionally deferred at the user’s instruction; the application remains guarded for Paystack Test Mode and no real charge was initiated during this audit.

The checklist contains many items that cannot be marked complete without facts only the restaurant owner can provide. In particular, contact details, address, opening hours, social accounts, menu approval, delivery policy, refund policy, domain ownership, payment-provider onboarding, backup ownership, and client acceptance must be confirmed by the client rather than guessed by a developer.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| **Verified** | Demonstrated by source inspection, automated coverage, a recorded production check, or a non-destructive smoke test. |
| **Implemented; client sign-off needed** | The mechanism exists, but the business value or policy requires owner confirmation. |
| **Deferred** | Deliberately left out of this release; it must not be advertised as ready. |
| **Not supported** | The current product does not implement the checklist capability. |
| **Not tested** | Requires a deliberate operational or client test that was not safely performed during this audit. |

## Verified release areas

| Checklist area | Result | Evidence / limitation |
| --- | --- | --- |
| Customer storefront | **Verified** | Live Home and Menu routes returned HTTP 200 and displayed the approved The Crunch Bite title. Six Ghana Cedi menu categories are present. |
| Customer navigation | **Verified** | Home, Menu, Profile, Order Now, category routes, browser-safe direct routes, mobile drawer, and the All-menu scope are implemented. Rewards is intentionally hidden from primary navigation. |
| Search and accessibility | **Verified** | Menu search covers the live dish list. Search and cart controls expose accessible names. The final live desktop check reported the icon-only cart as `Open cart`. |
| Cart | **Verified by automated and prior live evidence** | Add, optimistic quantity edits, removal, totals, stale-read protection, rollback, and authoritative-response reconciliation are covered. No live order was created in this final audit. |
| Checkout | **Implemented; client sign-off needed** | Pickup and delivery validation, cash checkout, online payment state, duplicate-safe mutation flow, and clear loading/error states are implemented. A real customer acceptance order is still a client-owned decision, especially while Paystack is deferred. |
| Customer accounts | **Verified by automated coverage** | Local email/password auth, scrypt password hashing, session handling, role separation, password visibility, bounded recovery flow, profile editing, and order history are implemented. Public reset email is intentionally limited until a verified Resend domain exists. |
| Kitchen Board | **Verified by automated and prior live evidence** | Server-enforced Kitchen/Admin access, active/finished views, valid pickup/delivery transitions, five-second polling, optimistic status feedback, and loading clarity are implemented. Failure testing on real disconnected devices remains not tested. |
| Manager Console | **Verified by prior live evidence** | Admin-only reporting includes order, fulfillment, collection, menu, payment, inventory, recipe cost, expense, COGS, waste, and guarded profit views. Profit remains partial when cost coverage is incomplete. |
| Menu management | **Verified by automated and prior live evidence** | Kitchen/Admin users can create, edit, deactivate/restore, set availability, and upload JPEG/PNG/WebP images up to 5 MB through Supabase Storage. Existing orders retain snapshots. |
| Telegram | **Verified by prior recorded evidence** | Cash orders notify after checkout; online orders notify only after verified payment. Notification failure does not delete the order. The live group and bot ownership still belong to the client to confirm. |
| Data and permissions | **Verified by source and regression coverage** | Admin procedures use server-side role checks, customer data is scoped by authenticated user, and catalog changes use soft deactivation. No secret is recorded in this document. |
| Deployment and headers | **Verified** | Vercel serves the frontend, Render serves the API, Supabase stores PostgreSQL data and uploaded images, missing hashed assets return 404 rather than SPA HTML, HTTPS headers are present, and `/healthz` returned 200 during this audit. |

## Paystack decision

Paystack is **explicitly deferred**. The Paystack dashboard was reachable but visibly remained in Test Mode, with incomplete compliance onboarding and 2FA disabled at the time of inspection. No dashboard settings were edited and no payment was initiated.

The code currently uses an `sk_test_...` server secret, verifies payment details server-side, validates the raw webhook signature, checks GHS currency and integer pesewa amounts, and performs an idempotent payment transition before Kitchen/Telegram release. These controls are appropriate for the current test integration, but they do not constitute a live launch approval.

Before a future live switch, the owner must complete Paystack onboarding/compliance, secure the dashboard, provide a live server secret through a secret manager, configure the live webhook, confirm support and reconciliation procedures, and approve a carefully bounded real-money acceptance test. See the official [Paystack authentication documentation][1], [webhook documentation][2], and [payment verification documentation][3].

## Client-owned approvals still required

| Decision | Why the developer cannot invent it |
| --- | --- |
| Contact phone, email, address, location, hours, and social links | These are public business facts and must be supplied and approved by the restaurant. |
| Menu names, descriptions, prices, images, availability, and allergen wording | The owner must approve the commercial catalog and food information. |
| Delivery zones, fees, minimum order, cutoff time, cancellation, refund, and discount policy | These are operating and financial policies, not UI defaults. |
| Dine-in ordering | The current product focuses on pickup and delivery; dine-in requires a product decision. |
| Opening/closed switch and scheduled hours | The current release does not provide a complete restaurant-wide open/closed control. |
| Domain and account ownership transfer | The client must control Vercel, Render, Supabase, Paystack, Telegram, Resend, and the domain. |
| Backup schedule and restoration drill | The Supabase owner must configure backups and a recovery owner. |
| Real-user acceptance | A person who has never used the system should complete customer, Kitchen, and admin tasks and record confusion. |

## Deferred or unsupported capabilities

The current release does not claim guest checkout, add-ons/modifiers, discounts, taxes/service charges, refunds, customer-initiated cancellation, a live Rewards programme, a restaurant open/closed scheduler, real-time WebSockets, offline Kitchen operation, automatic Telegram retries with a durable queue, or live Paystack payments. Where the existing product has no corresponding business rule, the interface must not imply that the feature is available.

The checklist’s request to repeat 10–20 full production test orders is intentionally not performed here. Creating production orders, charges, customer accounts, or financial records would pollute the restaurant’s reporting and could create real-world liability. Use a dedicated staging database and Paystack Test Mode for that exercise.

## Final smoke results

| Check | Result |
| --- | --- |
| `https://sandsly.vercel.app/` | HTTP 200; title `The Crunch Bite`. |
| `https://sandsly.vercel.app/menu` | HTTP 200; title `The Crunch Bite`. |
| `https://sandsly.onrender.com/healthz` | HTTP 200 with `{"ok":true}`; the measured cold request took approximately 66 seconds, so the autoscaling tier remains a latency risk for first API access. |
| Missing hashed asset path | HTTP 404 with `text/plain`, not the SPA HTML shell. |
| Security headers | CSP, `nosniff`, `DENY` framing, restrictive referrer policy, and permissions policy were present. |
| Paystack dashboard | Reachable but still Test Mode; no change made. |
| Repository checks | The current release candidate passes TypeScript, 39 test files / 104 tests, and the production build. The final Render configuration declaration includes the documented Supabase storage variables. |

## Recommended client handoff order

First provide the client with the public website URL and the staff/admin URLs. Next transfer ownership or admin access for Vercel, Render, Supabase, GitHub, Telegram, Resend, and the domain. Then provide credentials through a password manager rather than email or this repository. Finally conduct a staging acceptance test, approve the business policies, and schedule a post-launch smoke test that is explicitly separated from Paystack live activation.

[1]: https://paystack.com/docs/api/authentication/ "Paystack Authentication"
[2]: https://paystack.com/docs/payments/webhooks/ "Paystack Webhooks"
[3]: https://paystack.com/docs/payments/verify-payments/ "Paystack Verify Payments"

## Mobile UI release evidence

The final responsive pass targets a 375 × 812 phone viewport without changing ordering, payment, inventory, or role-protection behavior. Account sign-in and registration controls now use full-width phone-friendly actions and 16px form text to avoid mobile browser zoom. Cart fulfillment choices, checkout fields, finance controls, Kitchen status actions, and Manager Console sections stack before the small breakpoint. Menu search and category controls remain readable and horizontally discoverable on narrow screens.

The reviewed phone routes were `/profile`, `/cart`, `/menu`, `/kitchen`, and `/admin`. A 1280 × 720 cross-check of `/`, `/menu`, `/profile`, and `/cart` confirmed that the desktop sidebar, menu grid, account form, and empty-bag composition remain intact. The supporting record is [`verification-mobile-ui.md`](verification-mobile-ui.md), and the regression file is [`server/mobile-responsive.test.ts`](server/mobile-responsive.test.ts).

The remaining mobile handoff item is client acceptance on a real iOS or Android device, including keyboard behavior, touch scrolling, image loading on the client network, and a non-destructive staff walkthrough. This is intentionally separate from real-money Paystack activation.

## Manager Console loading-state evidence

Initial Manager Console analytics loading now preserves the dashboard composition with animated skeletons for the revenue trend, follow-up queue, Food Performance, Payment Ledger, and latest orders. The skeletons announce a polite loading status to assistive technology and disable pulsing under reduced-motion preferences. The Payment Ledger skeleton follows the same phone-card/wide-table structure as the loaded state, preventing the loading transition from introducing a layout jump.

The implementation is covered by the responsive regression suite and the final repository validation: TypeScript, 39 test files / 104 tests, and production build all pass. The existing non-destructive constraint remains in place; no reporting, customer, payment, inventory, or expense records were created.
