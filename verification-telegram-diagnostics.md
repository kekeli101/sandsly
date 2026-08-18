# Telegram Delivery Incident Record

## Diagnosis

On 18 August 2026, the deployed Render service logged: `[Telegram] Notification skipped because Telegram credentials are not configured`. The order notification code intentionally does not block checkout when notification delivery is unavailable, so orders continued to be created without reaching the Telegram group.

The configured bot token independently passed the Telegram `getMe` check, and the bot was able to access the configured destination chat through `getChat`. This ruled out an invalid bot token and group-access failure in the verified configuration.

## Correction

The deployed `sandsly` Render web service was missing `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. Both server-side environment variables were added to the service on 18 August 2026, and Render was instructed to rebuild and deploy the API. Neither value is stored in this repository or documented here.

Render reported a successful build for commit `ef5925d` and began deploying the updated service. Startup and real-message delivery remain to be checked after the deployment reaches its live state.

## Delivery verification

The restarted Render API responded successfully on `/healthz`. A clearly labelled integration-test message was then submitted to the configured Telegram chat; Telegram accepted the request. The bot token and destination chat checks also pass in automated integration coverage. Future successful sends are now logged as `[Telegram] New-order notification accepted for <order number>`, while notification failures remain non-blocking for customer checkout.

A disposable production pickup checkout, order `CB-34622918-797`, was created at 06:30 on 18 August 2026 with the kitchen note “Telegram verification order — please discard after notification check.” It is visible in the authenticated production Profile order timeline and should be discarded from the Kitchen Board after delivery verification is confirmed.

Render application logs confirm that the repaired service started successfully at 06:25:55 and was live at 06:26:03. The deployed revision that processed the disposable checkout did not yet include the later success-log enhancement, so the Render log has no positive send entry for this particular order and no new missing-credential warning. Group receipt confirmation is therefore recorded separately from the order and deployment evidence.

The project owner confirmed receipt of the formatted Telegram notification for `CB-34622918-797` in the configured group. This completes the production checkout-to-Telegram verification.
