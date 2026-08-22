# Paystack Test Mode webhook verification

## Verified configuration

On **2026-08-22**, the Paystack Test Mode developer settings were reloaded in the authenticated owner browser after the approved configuration action. The **Test Webhook URL** field persisted as:

```text
https://sandsly.onrender.com/api/paystack/webhook
```

The reloaded server-backed form marked its `Save changes` submit control as **disabled**, meaning the displayed endpoint was not a local unsaved edit and no further save action was available. This provides the operational persistence evidence that the public Render endpoint is registered in **Paystack Test Mode**. No live-mode setting, live key, transaction, customer charge, or production payment was created during this verification.

## Deployed-endpoint evidence

| Check | Observed result | Meaning |
| --- | --- | --- |
| Dashboard persistence | Authenticated Test Mode settings reloaded with the exact webhook URL and a disabled `Save changes` submit control | The setting is persisted by Paystack rather than remaining a local unsaved form change. |
| Render health endpoint | `GET https://sandsly.onrender.com/healthz` returned `{"ok":true}` with HTTP 200 | The deployed API behind the registered webhook URL is reachable. |
| Untrusted webhook probe | A JSON `POST` with a deliberately invalid `x-paystack-signature` returned `{"received":false}` with HTTP 401 | The public endpoint rejects a request that is not signed with the Paystack Test Mode secret. |
| Application regression suite | The webhook implementation milestone previously completed TypeScript validation, 25 test files / 69 tests, and a production build | Raw-body signature validation, malformed input handling, replay safety, amount/reference checks, and return/webhook concurrency remain covered. |

The endpoint intentionally returns a non-success status for an invalid signature and does not create, verify, or release an order. This was a safe ingress-security probe only; it did not simulate a payment or invoke Paystack's transaction API.

## Reconciliation behavior

Paystack's payment-webhook guidance specifies a signed `POST` request and identifies `charge.success` as the successful-charge event. Sandsly validates the raw-body HMAC-SHA512 header before parsing, then independently verifies the transaction and requires the matching reference, GHS currency, exact pesewa amount, and successful provider status. [1]

Only the first verified pending-to-successful transition releases an online order to Kitchen and sends its Telegram notice. Browser-return verification and webhook delivery share this transition, so duplicate delivery or a race cannot cause duplicate staff actions. A full end-to-end provider-delivered event remains naturally dependent on a future deliberate Paystack **test** transaction; none was created for this configuration-only verification.

## Scope and launch boundary

This record verifies the configuration and defensive ingress behavior for **Paystack Test Mode only**. Before any live launch, the owner must separately approve live payments, supply an approved `sk_live_...` credential through the API host, review the live dashboard webhook URL, and complete a controlled live end-to-end test. The current integration explicitly rejects live credentials.

## References

[1]: https://paystack.com/docs/payments/webhooks/ "Paystack Webhooks"
