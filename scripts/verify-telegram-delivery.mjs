const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (process.env.CONFIRM_TELEGRAM_DELIVERY_TEST !== "1") {
  throw new Error("Set CONFIRM_TELEGRAM_DELIVERY_TEST=1 before sending a live Telegram verification message.");
}

if (!token || !chatId) {
  throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must both be configured.");
}

const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    chat_id: chatId,
    text: "Sandsly Telegram integration test — order notifications are configured and this is not a customer order.",
  }),
  signal: AbortSignal.timeout(10_000),
});

const payload = await response.json().catch(() => null);
if (!response.ok || !payload?.ok) {
  throw new Error(`Telegram integration test failed with HTTP ${response.status}.`);
}

console.log("Telegram integration test message accepted by Telegram.");
