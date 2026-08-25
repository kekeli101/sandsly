# The Crunch Bite QA remediation verification

## Production evidence — 25 August 2026

The deployed public site at `https://sandsly.vercel.app` now identifies itself as **The Crunch Bite**. The primary navigation exposes Home, Menu, Profile, and the bag-aware order action; Rewards is no longer a primary-navigation destination.

| Remediated finding | Production evidence |
| --- | --- |
| Stale lazy Cart asset | The previously reported hashed URL, `/assets/Cart-D4Io_aHX.js`, returned **HTTP 404** with `text/plain` rather than a rewritten HTML application shell. |
| Controlled security headers | The home response returned CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy`, `X-Frame-Options: DENY`, and HSTS. |
| Brand and Rewards readiness | The browser title and visible header read **The Crunch Bite**; no Rewards item appeared in the public primary navigation. |
| Search scope and accessibility | The Menu page exposed a control named **Search the full menu**, selected **All** by default, and searching `pork` returned both live Pork dishes without requiring a category switch. |
| Fresh mobile rendering | An isolated **375 × 812** Chromium capture rendered The Crunch Bite header, the All filter, readable search field, and the visible **SWIPE →** category affordance without a blank transition or unfinished Rewards navigation. |
| Staff entry | An isolated **375 × 812** capture of `/staff` rendered the **Operations sign-in** form with role-specific Kitchen/manager guidance and a clear customer-sign-in return link. |
| Desktop cart accessibility | On `https://sandsly.vercel.app/menu`, the desktop icon-only cart control exposed the accessible name **Open cart**. The same live navigation listed Home, Menu, and Profile without Rewards. |
| QA data cleanup | The approved inactive verification dish, Polling Test Customer user, and its two confirmed unpaid QA orders were removed in one guarded production transaction. A post-delete read-only check returned zero matching product, user, and order records. |

No order, payment, stock change, menu mutation, or other customer-facing operational action was created during production browser verification.

## Remaining release note

The main JavaScript bundle retains the existing non-blocking size warning. The current release keeps route-level chunks and route-intent preloading; future work can use real-user performance telemetry to prioritize further bundle splitting.

## Final validation

The final local validation completed successfully with **TypeScript**, **38 passing test files / 99 tests**, and a production build. Regression coverage includes stale lazy-import detection, Vercel asset-routing and header policy, global menu filtering, primary bag routing, Kitchen initial loading, account/password behavior, and the desktop icon-only cart accessible name.

The final browser deployment check after publication remains limited to non-destructive navigation, accessibility, headers, and static-asset responses. No order, payment, inventory, menu, status, or account action will be created as part of that check.

## Sources

[1] [Vercel `vercel.json` configuration](https://vercel.com/docs/project-configuration/vercel-json) describes path-based headers and deployment configuration used for response hardening.

[2] [Vercel rewrites](https://vercel.com/docs/routing/rewrites) documents regex path matching used to exclude immutable `/assets/` files from the SPA fallback.
