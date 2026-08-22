# Paystack integration notes

## Selected approach

Sandsly will use **Paystack hosted redirect checkout**. The server will initialize a GHS transaction using the amount calculated from the persisted restaurant order, then return Paystack’s authorization URL to the storefront. The browser will redirect the customer to Paystack and return to a Sandsly callback route carrying the transaction reference.

## Required safeguards

| Control | Implementation decision |
| --- | --- |
| Secret key | Use only from the Express/tRPC API through a server-only `PAYSTACK_SECRET_KEY` environment variable. |
| Amount | Initialize and verify the exact server-stored order total in pesewas; never accept a client-provided amount. |
| Identity | Use the authenticated customer email and a unique, server-generated reference that is associated with one order. |
| Verification | Verify the reference on the server after return, and treat the Paystack transaction `data.status` rather than the outer API response status as authoritative. |
| Idempotency | Record a successful reference once and make repeated verification return the persisted payment state without duplicate fulfilment. |
| Confirmation | Keep the existing order pending until a verified Paystack success; signed `charge.success` webhook handling independently confirms browser-abandoned payments. |

Paystack requires server-side transaction initialization with a bearer secret key, an email, an amount in the currency subunit, a unique reference, and a fully qualified callback URL. Its documentation states that a callback visit alone does not prove payment and that the server must verify the reference and amount before delivering value. [1] [2] [3]

## Webhook reconciliation

Paystack sends `charge.success` to `POST /api/paystack/webhook` at the public Render API URL. The handler checks the raw-body `x-paystack-signature` HMAC-SHA512 header before parsing the payload, then verifies the referenced transaction with Paystack and requires an exact `GHS` amount, reference, and `success` status. This avoids treating an incoming event alone as proof of payment. [2] [4]

The database uses an atomic pending-to-successful update. Replayed events are acknowledged, but only the first successful transition exposes an online order to Kitchen and triggers its Telegram notification. Unsupported, malformed, unsigned, mismatched, and failed events cannot update payment state. Transient processing failures return a retryable response, consistent with Paystack’s webhook retry guidance. [4]

## Sources

[1]: https://paystack.com/docs/api/transaction/ "Paystack Transaction API"
[2]: https://paystack.com/docs/payments/accept-payments/ "Paystack Accept Payments"
[3]: https://paystack.com/docs/payments/verify-payments/ "Paystack Verify Payments"
[4]: https://paystack.com/docs/payments/webhooks/ "Paystack Webhooks"
