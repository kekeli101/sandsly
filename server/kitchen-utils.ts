import type { OrderStatus, OrderType } from "../drizzle/schema";

export const kitchenNextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  out_for_delivery: "delivered",
};

export function getNextKitchenStatus(status: OrderStatus, orderType: OrderType = "pickup") {
  if (status === "ready") return orderType === "delivery" ? "out_for_delivery" : "completed";
  return kitchenNextStatus[status] ?? null;
}

export function isValidKitchenTransition(current: OrderStatus, next: OrderStatus, orderType: OrderType = "pickup") {
  return getNextKitchenStatus(current, orderType) === next || ((current === "pending" || current === "accepted") && next === "cancelled");
}

export function getKitchenActionLabel(status: OrderStatus, orderType: OrderType = "pickup") {
  const labels: Partial<Record<OrderStatus, string>> = {
    pending: "Accept order",
    accepted: "Start preparing",
    preparing: "Mark ready",
    ready: orderType === "delivery" ? "Out for delivery" : "Complete order",
    out_for_delivery: "Mark delivered",
  };
  return labels[status] ?? null;
}
