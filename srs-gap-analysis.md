# SRS Coverage and Next-Release Plan

This assessment maps the August 2026 **Restaurant Ordering and Management System** SRS to the current Sandsly product.

## Coverage summary

| SRS area | Current coverage | Next-release action |
| --- | --- | --- |
| Account registration and signed sessions | Implemented with local email/password authentication and role checks | Retain; add checkout-required contact validation where needed |
| Menu browsing, cart, and Ghana Cedi pricing | Implemented, including category filtering and product availability | Add text search and a clearer availability state |
| Customer order tracking | Partial: profile lists past orders and status | Add order type, payment state, order details, and a visual status timeline |
| Pickup and delivery orders | Missing: checkout does not collect or persist the selection | Add pickup/delivery selection and validate delivery contact/address |
| Payment management | Missing: checkout does not record a payment method or payment lifecycle | Add cash/Mobile Money/card selection and persisted payment state; defer live payment collection until a provider and credentials are selected |
| Kitchen interface | Implemented: live polling, status transitions, Active/Completed tabs | Show order type, payment state, delivery information, and include delivery status transitions when applicable |
| Menu management | Implemented for Kitchen/Admin staff, including soft availability changes | Preserve the existing staff workflow; Admin dashboard will add oversight rather than duplicate the editor |
| Administrator operations and reports | Partial: protected recent-order endpoint only | Add an Admin dashboard with metrics, recent orders, customer counts, and popular items |
| Telegram new-order alert | Implemented and non-blocking | Enrich alerts with order type, payment state, and delivery/pickup details |
| Status history | Missing | Add durable order-status history rows and customer-visible tracking events |
| Delivery staff | Missing | Defer dedicated delivery-staff role and assignment queue to a later release; model delivery lifecycle now so it can be added safely |
| Email/SMS and real gateway payments | Missing external integrations | Require user-selected providers and credentials before implementation |

## Selected next-release scope

The next release will implement the highest-impact SRS gaps that do not require a third-party payment provider or messaging credentials:

1. Pickup and delivery checkout, including delivery contact and address validation.
2. Payment method and payment-status records with safe offline options: cash on pickup, cash on delivery, Mobile Money pending, and card pending.
3. Order-detail tracking with a status timeline backed by immutable status-history records.
4. Order lifecycle support for out-for-delivery and delivered orders, while preserving the current Kitchen workflow.
5. A protected Admin dashboard with operational metrics, recent orders, customer count, and popular menu items.
6. Menu text search and SRS-aligned catalog visibility behavior.
7. Telegram message enrichment with order type, payment state, and delivery/pickup information.

## Integration prerequisites intentionally deferred

Live Mobile Money/card collection, provider webhooks, receipts, email/SMS delivery, delivery-staff assignment, and advanced inventory/reports require provider selection, API credentials, and an operational policy. The implementation will model the required states now without accepting or storing payment credentials.
