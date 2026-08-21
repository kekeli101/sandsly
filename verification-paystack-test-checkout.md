# Paystack test-checkout verification

## Credential and deployment configuration

The configured `PAYSTACK_SECRET_KEY` was validated with a read-only Paystack transaction-list request. The credential is a test key, and no transaction initialization or real customer charge was performed by that credential check.

On 2026-08-21, the approved Render environment editor for the Sandsly API was opened to add the server-only Paystack test credential. The editor is in its pending save state; the secret value is not recorded in this repository or verification file. After saving, the API deployment and health endpoint will be verified.

The user confirmed the credential was saved and Render started deployment `dep-da497ps9v7es739fimtg`. The deployment logs report a successful production build and upload, followed by the service deployment handoff. No secret value was displayed or recorded.

Render then completed its build and upload stages and launched `pnpm run start` with `NODE_ENV=production`. The service had not yet displayed its final live/startup confirmation at the time of this record, so deployment monitoring continues.

Render subsequently reported that the API service was live at `https://sandsly.onrender.com`; its public health endpoint returned `{"ok":true}`. The local 375px review confirmed the hosted-payment return screen remains readable and gives a safe route back to order history when a reference is absent.

Final local validation completed with a clean TypeScript check, **24 test files and 64 tests passing**, and a successful production build. The test suite covers: test-key validation; server-authoritative amount, currency, reference, and ownership checks; idempotent success verification; cancelled, failed, and mismatched payment rejection; a retry route for pending online orders; Kitchen exclusion for unverified online payments; deferred Telegram notices until confirmed payment; and rendered checkout/return customer states. No real payment was initiated or collected.
