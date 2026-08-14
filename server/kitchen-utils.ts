import type { OrderStatus } from "../drizzle/schema";

export const kitchenNextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "completed",
};

export function isValidKitchenTransition(current: OrderStatus, next: OrderStatus) {
  return kitchenNextStatus[current] === next || ((current === "pending" || current === "accepted") && next === "cancelled");
}

export function getKitchenActionLabel(status: OrderStatus) {
  const labels: Partial<Record<OrderStatus, string>> = {
    pending: "Accept order",
    accepted: "Start preparing",
    preparing: "Mark ready",
    ready: "Complete order",
  };
  return labels[status] ?? null;
}
