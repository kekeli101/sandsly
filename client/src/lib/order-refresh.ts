const terminalStatuses = new Set(["completed", "delivered", "cancelled"]);

export function getOrderRefreshInterval(orders: readonly { status: string }[] | undefined, intervalMs = 15_000): number | false {
  return orders?.some(order => !terminalStatuses.has(order.status)) ? intervalMs : false;
}
