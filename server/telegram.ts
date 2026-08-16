type TelegramOrder = {
  orderNumber: string;
  status: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; unitPricePesewas: number; lineTotalPesewas: number }>;
  subtotalPesewas: number;
  deliveryFeePesewas: number;
  totalPesewas: number;
  customerNote?: string;
};

function formatGhs(pesewas: number) {
  return `GH₵ ${(pesewas / 100).toFixed(2)}`;
}

export function formatTelegramOrderMessage(order: TelegramOrder) {
  const itemLines = order.items.map(
    (item) => `• ${item.name} ×${item.quantity} — ${formatGhs(item.lineTotalPesewas)}`,
  );
  const note = order.customerNote?.trim() ? `\nNote: ${order.customerNote.trim()}` : "";

  return [
    "🍽️ NEW SANDSLY ORDER",
    `Order: ${order.orderNumber}`,
    `Customer: ${order.customerName || "Customer"}`,
    "",
    "Items:",
    ...itemLines,
    "",
    `Subtotal: ${formatGhs(order.subtotalPesewas)}`,
    `Delivery: ${formatGhs(order.deliveryFeePesewas)}`,
    `Total: ${formatGhs(order.totalPesewas)}`,
    `Status: ${order.status.toUpperCase()}`,
    note,
  ].filter(Boolean).join("\n");
}

export async function notifyTelegramNewOrder(order: TelegramOrder) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("[Telegram] Notification skipped because Telegram credentials are not configured");
    return false;
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: formatTelegramOrderMessage(order) }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const payload = (await response.json()) as { ok?: boolean };
  if (!payload.ok) throw new Error("Telegram sendMessage returned ok=false");
  return true;
}
