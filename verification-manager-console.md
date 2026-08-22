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

## Automated release validation

The release completed a clean TypeScript check, **27 test files / 73 tests passing**, and a successful production build. The added regression coverage confirms that customers and Kitchen staff are rejected by the manager analytics procedure, while an administrator receives the server-computed operational and finance snapshot. Rendered UI coverage verifies the sales, online-collection, cash-reconciliation, food-performance, payment-ledger, and explicit non-profit framing. Profile coverage also confirms that a normal customer does not see the Manager Console entry and that an administrator is routed to `/admin` from that entry.

An authenticated administrator browser session was not available for a live-data screenshot during this pass. The protected-route desktop and phone reviews, server authorization tests, and rendered administrator snapshot verification were completed without fabricating operational figures. This validates the responsive route boundary and the management data layout; a future owner-session review may additionally confirm the actual production data presentation after the owner signs in.
