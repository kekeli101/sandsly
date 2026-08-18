import { applyOptimisticQuantity, restoreCartLineFromSnapshot, type CartSnapshot } from "./cart-optimistic";
import type { CartCacheApi } from "./cart-mutation-lifecycle";

export type CartEditInput = { productId: string; quantity: number };
export type OptimisticCartEditContext = { previous: CartSnapshot | undefined; edit: CartEditInput };

/** Coordinates optimistic cart editing while protecting newer taps from older failures. */
export function createCartEditMutationLifecycle(cache: CartCacheApi) {
  const latestQuantityByProduct = new Map<string, number>();
  let pendingEdits = 0;

  return {
    async onMutate(edit: CartEditInput): Promise<OptimisticCartEditContext> {
      await cache.cancel();
      const previous = cache.getData();
      latestQuantityByProduct.set(edit.productId, edit.quantity);
      pendingEdits += 1;
      cache.setData(applyOptimisticQuantity(previous, edit.productId, edit.quantity));
      return { previous, edit };
    },
    onError(context: OptimisticCartEditContext | undefined) {
      if (!context) return;
      if (latestQuantityByProduct.get(context.edit.productId) === context.edit.quantity) {
        cache.setData(restoreCartLineFromSnapshot(cache.getData(), context.previous, context.edit.productId));
      }
    },
    onSettled(context: OptimisticCartEditContext | undefined) {
      if (context && latestQuantityByProduct.get(context.edit.productId) === context.edit.quantity) latestQuantityByProduct.delete(context.edit.productId);
      pendingEdits = Math.max(0, pendingEdits - 1);
      if (pendingEdits === 0) void cache.invalidate();
    },
  };
}
