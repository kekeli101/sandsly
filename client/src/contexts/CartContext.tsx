// Style reminder: cart feedback should feel immediate, tactile, and visually consistent with the orange action color.

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { MenuItem } from "@/lib/menu-data";

type CartLine = MenuItem & { quantity: number };

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  addItem: (item: MenuItem) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (item: MenuItem) => {
      setLines((current) => {
        const existing = current.find((line) => line.id === item.id);
        if (existing) {
          return current.map((line) =>
            line.id === item.id ? { ...line, quantity: line.quantity + 1 } : line,
          );
        }
        return [...current, { ...item, quantity: 1 }];
      });
    };

    const updateQuantity = (id: string, delta: number) => {
      setLines((current) =>
        current
          .map((line) => (line.id === id ? { ...line, quantity: line.quantity + delta } : line))
          .filter((line) => line.quantity > 0),
      );
    };

    const removeItem = (id: string) => setLines((current) => current.filter((line) => line.id !== id));
    const clearCart = () => setLines([]);
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

    return { lines, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
