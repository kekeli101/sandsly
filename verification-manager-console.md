# Manager Console verification

## Protected-route visual review

The `/admin` route was reviewed in the local application at desktop and phone viewports while no administrator session was available. The route correctly presented the branded protected state rather than exposing management data to an unauthenticated visitor.

| Viewport | Observed result |
| --- | --- |
| Desktop | The protected route rendered a compact, high-contrast management gate on the existing matte-black restaurant surface. |
| 375 × 812 phone | The gate remained readable and well-spaced, with the The Crunch Bite back-of-house label, orange access marker, and short owner/manager access guidance. |

The actual management data view is guarded by both the admin-only server procedure and the client-side role guard. Its rendered component coverage supplies a controlled owner data snapshot for the sales, online-collection, cash-reconciliation, food-performance, payment-ledger, and recent-order sections; live operational figures were not fabricated for visual review.

## Financial boundary

The console explicitly separates **fulfilled sales**, **provider-verified online collection**, and **finished cash orders requiring reconciliation**. It does not represent sales as profit because Sandsly currently has no persisted food-cost, stock, supplier-bill, payroll, or cash-deposit records.

## Live administrator verification

On **2026-08-22**, the repaired `admin@mail.com` administrator account signed in successfully at the deployed Vercel storefront. The administrator-only Profile entry opened `/admin`, and the deployed Render reporting procedure returned the live management snapshot through the bounded browser-session authorization transport.

| Verified area | Observed live result |
| --- | --- |
| Access boundary | The authenticated identity rendered as **Restaurant Manager · Admin**; the Manager Console entry was visible and `/admin` opened successfully. |
| Sales and collections | The live snapshot displayed fulfilled sales, verified online collection, cash requiring reconciliation, active Kitchen work, and current menu health. |
| Operational analysis | The seven-day sales panel, manager follow-up queue, top dishes, payment ledger, and latest-order oversight sections all rendered from live data. |
| Financial framing | The deployed page continued to distinguish verified online collection and reconciliation-needed cash from profit, rather than estimating costs or profitability. |
| Responsive coverage | The live data view was validated at desktop size and again at a configured **375 × 812** phone-sized viewport. |

The first live report was delayed by concurrent database aggregates on the low-capacity Render/Supabase connection budget. The reporting helper was changed to execute its short aggregates sequentially, after which the same authenticated administrator received the complete live snapshot. This preserves server-computed results while avoiding connection-pool saturation.

## Live phone-sized data verification

On **2026-08-22**, a new authenticated production administrator session was established through the same short-lived browser-session authorization path used by the storefront, and `/admin` was reviewed at a configured **375 × 812** mobile viewport. This was an actual deployed data review, not the earlier unauthenticated protected-state check or a controlled/mock snapshot.

| Mobile area | Observed deployed result |
| --- | --- |
| Summary and operations | The stacked Manager Console cards displayed fulfilled sales of **GH₵4,840.00**, verified online collection of **GH₵95.00**, cash to reconcile of **GH₵300.00**, five active Kitchen orders, and fourteen live menu items. |
| Manager follow-ups and food performance | The mobile layout showed the follow-up queue and the top-selling dishes panel with server-computed dish and sales information. |
| Payment oversight | The payment method/status ledger rendered in the phone layout with its payment-state and amount columns readable within the console surface. |
| Order oversight | The Latest Orders section rendered a vertical, touch-friendly list of real order records with GHS totals and status tags; no orders or payments were created for this review. |
| Mobile behavior | The page remained a single-column management workspace from KPI cards through trend, follow-ups, food performance, payment ledger, and the complete recent-order list, without exposing the protected gate. |

This phone-sized verification confirms that the authenticated administrator receives the same live server-authoritative reporting snapshot at mobile width. Reported sales and collection figures remain operational totals, **not profit**.

## Automated release validation

The release completed a clean TypeScript check, **29 test files / 76 tests passing**, and a successful production build. The added regression coverage confirms that customers and Kitchen staff are rejected by the manager analytics procedure, while an administrator receives the server-computed operational and finance snapshot. The authorization transport coverage validates a signed bearer credential, invalid-credential rejection, and browser-session-only storage. Rendered UI coverage verifies the sales, online-collection, cash-reconciliation, food-performance, payment-ledger, and explicit non-profit framing. Profile coverage also confirms that a normal customer does not see the Manager Console entry and that an administrator is routed to `/admin` from that entry.

The live deployed administrator review supplements the protected-route review and the controlled rendered snapshot verification. No temporary orders, payments, customer reviews, or other fabricated operational records were created for either desktop or phone-sized verification.

## Specific-day order lookup

The Manager Console now includes an accessible **Specific day** date control. Leaving it blank keeps the report unfiltered; choosing a date sends a validated `YYYY-MM-DD` value to the admin reporting procedure and scopes order, payment, food-performance, COGS, waste, and operating-expense results to that Ghana-local calendar day. The current inventory-on-hand and menu-health snapshots remain global context. Clearing the control returns to the all-days view.

The control uses phone-safe sizing and stacks with the report header at narrow widths. The unauthenticated 375 × 812 route check continued to show the protected management gate, while rendered administrator coverage verified the date input and default all-days state. The specific-day router forwarding, malformed-input rejection, Ghana-local date-range parsing, and existing Manager Console rendering tests pass.
