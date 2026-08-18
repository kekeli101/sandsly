import type { CartLine, CatalogProduct } from "./catalog-types";

export type CartSnapshot = {
  items: CartLine[];
  subtotalPesewas: number;
  deliveryFeePesewas: number;
  totalPesewas: number;
};

function totals(items: CartLine[], deliveryFeePesewas: number) {
  const subtotalPesewas = items.reduce((sum, line) => sum + line.pricePesewas * line.quantity, 0);
  return { subtotalPesewas, deliveryFeePesewas, totalPesewas: subtotalPesewas + deliveryFeePesewas };
}

export function applyOptimisticAdd(cart: CartSnapshot | undefined, product: CatalogProduct): CartSnapshot {
  const previous = cart ?? { items: [], subtotalPesewas: 0, deliveryFeePesewas: 0, totalPesewas: 0 };
  const existing = previous.items.find((item) => item.id === product.id);
  const items = existing
    ? previous.items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
    : [...previous.items, { id: product.id, name: product.name, description: product.description, pricePesewas: product.pricePesewas, imageUrl: product.imageUrl, badge: product.badge, crunchLevel: product.crunchLevel, quantity: 1 }];
  return { items, ...totals(items, previous.deliveryFeePesewas) };
}

export function rollbackOptimisticAdd(cart: CartSnapshot | undefined, productId: string): CartSnapshot | undefined {
  if (!cart) return cart;
  const existing = cart.items.find((item) => item.id === productId);
  if (!existing) return cart;
  const items = existing.quantity === 1
    ? cart.items.filter((item) => item.id !== productId)
    : cart.items.map((item) => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
  return { items, ...totals(items, cart.deliveryFeePesewas) };
}

export function applyOptimisticQuantity(cart: CartSnapshot | undefined, productId: string, quantity: number): CartSnapshot | undefined {
  if (!cart) return cart;
  const items = quantity <= 0
    ? cart.items.filter((item) => item.id !== productId)
    : cart.items.map((item) => item.id === productId ? { ...item, quantity } : item);
  return { items, ...totals(items, cart.deliveryFeePesewas) };
}

export function restoreCartLineFromSnapshot(current: CartSnapshot | undefined, previous: CartSnapshot | undefined, productId: string): CartSnapshot | undefined {
  if (!current) return previous;
  const previousLine = previous?.items.find((item) => item.id === productId);
  const hasCurrentLine = current.items.some((item) => item.id === productId);
  const items = previousLine
    ? hasCurrentLine
      ? current.items.map((item) => item.id === productId ? previousLine : item)
      : [...current.items, previousLine]
    : current.items.filter((item) => item.id !== productId);
  const previousOrder = new Map((previous?.items ?? []).map((item, index) => [item.id, index]));
  const orderedItems = [...items].sort((left, right) => (previousOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (previousOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER));
  return { items: orderedItems, ...totals(orderedItems, current.deliveryFeePesewas) };
}
