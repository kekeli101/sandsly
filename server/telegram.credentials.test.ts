import { describe, expect, it } from "vitest";

describe("Telegram credentials", () => {
  it("authenticate with Telegram Bot API getMe", async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    expect(token, "TELEGRAM_BOT_TOKEN must be configured").toBeTruthy();

    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    expect(response.ok).toBe(true);

    const payload = (await response.json()) as {
      ok?: boolean;
      result?: { is_bot?: boolean };
    };
    expect(payload.ok).toBe(true);
    expect(payload.result?.is_bot).toBe(true);
  }, 15_000);

  it("can access the configured destination chat", async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    expect(token, "TELEGRAM_BOT_TOKEN must be configured").toBeTruthy();
    expect(chatId, "TELEGRAM_CHAT_ID must be configured").toBeTruthy();

    const response = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId!)}`);
    expect(response.ok).toBe(true);

    const payload = (await response.json()) as { ok?: boolean; result?: { id?: number | string } };
    expect(payload.ok).toBe(true);
    expect(String(payload.result?.id)).toBe(String(chatId));
  }, 15_000);
});
