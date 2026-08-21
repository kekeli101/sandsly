# Password recovery verification

## Local preview observation

The local preview first rendered the new unauthenticated account view with a password input, an explicitly labelled **Show password** control, and a **Forgot your password?** action. The preview then refreshed into an existing Kitchen Staff session, so the remaining unauthenticated interaction checks will continue after signing out of the local session.

After signing out of that local session, activating the **Show password** control changed the password input from `type="password"` to `type="text"` and changed the accessible action label to **Hide password**, without submitting the sign-in form.

The **Forgot your password?** action opened a dedicated local recovery-request view. Its copy states that reset instructions are sent only if the address matches a local Sandsly account, and the form presents an email field, a send action, and a return-to-sign-in control.

Submitting an unknown local address displayed the same generic confirmation: **“If an eligible Sandsly account matches that email, reset instructions have been sent.”** No account-specific information was exposed. The `/reset-password` route also rendered its new-password and confirmation fields, each with a separate **Show password** control, plus clear one-time-link and minimum-length guidance.

The reset page’s first visibility control changed only its corresponding field to plain text and relabelled itself **Hide password** while the confirmation field remained masked. At a 375px mobile viewport, both the profile sign-in/recovery entry point and reset-password page remained legible, contained within their cards, and retained appropriately sized controls without horizontal overflow.

## Automated and delivery-mode validation

The full TypeScript and Vitest validation completed with **19 test files and 46 tests passing**. The recovery tests cover random-token hashing, generic known/unknown responses, request cooldown, single-use reset redemption, invalid/expired rejection, failure-time token invalidation, and the testing-recipient gate. The Resend credentials test confirmed the API key and the configured testing recipient. Delivery remains deliberately restricted to that recipient while `onboarding@resend.dev` is configured; no public customer reset email was sent during verification.

The cooldown query now considers only unused, unexpired records. A simulated delivery failure invalidates its token, and an immediate second request can create a new token rather than being blocked by the prior failed attempt. Automated UI regression coverage confirms the visibility button remains an accessible non-submit control that toggles its input type, the profile recovery screen exposes only generic confirmation language, and the reset screen retains matching-password validation with two independent visibility fields.

The rendered JSDOM interaction tests exercise the password visibility toggle, the forgotten-password confirmation state, and the reset-screen password-match guard. Final validation completed with **21 test files and 53 tests passing**, alongside a clean TypeScript check.

## External API configuration

With explicit owner approval, the external Render API environment was updated with the three required server-only password-reset delivery settings and the service rebuild/deploy action was initiated. Sensitive values are intentionally not recorded here. The deployment remains restricted to the configured testing recipient while the Resend onboarding sender is in use.

Render confirmed that the environment variables were updated and initiated a fresh deployment from the connected repository. The deployment entered the build stage and checked out the configured main-branch revision; final service-health confirmation will be recorded after the build finishes.

The Render deployment completed its production build successfully and proceeded to start the Node service. The next verification step is the external health endpoint after startup, without sending a public password-reset email.

The external Render health endpoint subsequently returned `{"ok":true}`, confirming that the API recovered successfully after the environment update. No public reset email was sent; delivery remains constrained to the configured testing recipient.
