import type { CatalogProduct } from "./catalog-types";
import { applyOptimisticAdd, rollbackOptimisticAdd, type CartSnapshot } from "./cart-optimistic";

export type OptimisticAddContext = { previous: CartSnapshot | undefined; product: CatalogProduct | undefined };

export type CartCacheApi = {
  cancel: () => Promise<unknown>;
  getData: () => CartSnapshot | undefined;
  setData: (next: CartSnapshot | undefined) => void;
  invalidate: () => Promise<unknown> | unknown;
};

/**
 * Keeps the cart UI responsive while serialising optimistic add bookkeeping.
 * The API mirrors the tRPC query utilities used by CartContext so it can be
 * exercised without rendering a browser-only provider in the server suite.
 */
export function createCartMutationLifecycle(cache: CartCacheApi) {
  const queuedProducts: CatalogProduct[] = [];
  let pendingAdds = 0;
  let needsReconciliation = false;

  return {
    enqueue(product: CatalogProduct) {
      queuedProducts.push(product);
    },
    async onMutate(): Promise<OptimisticAddContext> {
      await cache.cancel();
      const product = queuedProducts.shift();
      const previous = cache.getData();
      if (!product) return { previous, product: undefined };
      pendingAdds += 1;
      cache.setData(applyOptimisticAdd(previous, product));
      return { previous, product };
    },
    onError(context: OptimisticAddContext | undefined) {
      if (!context?.product) return;
      needsReconciliation = true;
      if (pendingAdds <= 1) cache.setData(context.previous);
      else cache.setData(rollbackOptimisticAdd(cache.getData(), context.product.id));
    },
    onSuccess(serverCart: CartSnapshot | undefined) {
      if (pendingAdds <= 1 && serverCart) {
        cache.setData(serverCart);
        needsReconciliation = false;
      }
    },
    onSettled() {
      pendingAdds = Math.max(0, pendingAdds - 1);
      if (pendingAdds === 0 && needsReconciliation) {
        needsReconciliation = false;
        void cache.invalidate();
      }
    },
  };
}
