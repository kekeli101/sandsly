// Style reminder: use optimistic-feeling server-backed cart feedback while retaining the reference's compact orange actions.

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import type { CartLine, CatalogProduct } from "@/lib/catalog-types";

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotalPesewas: number;
  deliveryFeePesewas: number;
  totalPesewas: number;
  isLoading: boolean;
  isAuthenticated: boolean;
  addItem: (item: CatalogProduct) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const cartQuery = trpc.storefront.cart.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const refreshCart = () => utils.storefront.cart.invalidate();
  const addMutation = trpc.storefront.addToCart.useMutation({ onSuccess: refreshCart });
  const setQuantityMutation = trpc.storefront.setCartItemQuantity.useMutation({ onSuccess: refreshCart });
  const clearMutation = trpc.storefront.clearCart.useMutation({ onSuccess: refreshCart });

  const value = useMemo<CartContextValue>(() => {
    const lines = (cartQuery.data?.items ?? []) as CartLine[];
    const addItem = (item: CatalogProduct) => {
      if (!isAuthenticated) {
        toast.info("Sign in to save your bag and place an order.");
        window.location.assign("/profile");
        return;
      }
      addMutation.mutate({ productId: item.id, quantity: 1 }, {
        onSuccess: () => toast.success(`${item.name} added`, { description: "Saved to your bag." }),
        onError: (error) => toast.error("Couldn’t add that item", { description: error.message }),
      });
    };
    const updateQuantity = (id: string, delta: number) => {
      const line = lines.find((item) => item.id === id);
      if (!line) return;
      setQuantityMutation.mutate({ productId: id, quantity: Math.max(0, line.quantity + delta) });
    };
    const removeItem = (id: string) => setQuantityMutation.mutate({ productId: id, quantity: 0 });
    const clearCart = () => clearMutation.mutate();
    return {
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotalPesewas: cartQuery.data?.subtotalPesewas ?? 0,
      deliveryFeePesewas: cartQuery.data?.deliveryFeePesewas ?? 0,
      totalPesewas: cartQuery.data?.totalPesewas ?? 0,
      isLoading: cartQuery.isLoading,
      isAuthenticated,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    };
  }, [addMutation, cartQuery.data, cartQuery.isLoading, clearMutation, isAuthenticated, setQuantityMutation]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
