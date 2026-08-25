import { describe, expect, it, vi } from "vitest";
import { createCartEditMutationLifecycle } from "../client/src/lib/cart-edit-mutation-lifecycle";

const matcha = { id: "matcha-cloud-boba", name: "Matcha Cloud Boba", description: "Matcha", pricePesewas: 7500, imageUrl: "https://example.com/matcha.jpg", badge: null, crunchLevel: 2, quantity: 1 };
const tiger = { ...matcha, id: "tiger-sugar-boba", name: "Tiger Sugar Boba", pricePesewas: 6500 };
const initial = { items: [matcha, tiger], subtotalPesewas: 14000, deliveryFeePesewas: 0, totalPesewas: 14000 };

function createCache() {
  let value = initial;
  const events: string[] = [];
  let cancelGeneration = 0;
  const cache = {
    cancel: vi.fn(async () => { cancelGeneration += 1; events.push("cancel"); }),
    getData: vi.fn(() => value),
    setData: vi.fn((next) => { events.push("set"); value = next!; }),
    invalidate: vi.fn(() => { events.push("invalidate"); }),
  };
  const startStaleRead = () => {
    const generationAtStart = cancelGeneration;
    const staleResult = value;
    return () => {
      if (generationAtStart !== cancelGeneration) {
        events.push("stale-blocked");
        return;
      }
      events.push("stale-write");
      value = staleResult;
    };
  };
  return { cache, events, read: () => value, startStaleRead };
}

describe("optimistic cart editing", () => {
  it("updates quantity and totals immediately before persistence", async () => {
    const state = createCache();
    const lifecycle = createCartEditMutationLifecycle(state.cache);
    await lifecycle.onMutate({ productId: matcha.id, quantity: 3 });
    expect(state.cache.cancel).toHaveBeenCalledOnce();
    expect(state.read()).toEqual({ items: [{ ...matcha, quantity: 3 }, tiger], subtotalPesewas: 29000, deliveryFeePesewas: 0, totalPesewas: 29000 });
  });

  it("restores the full previous cart snapshot after a failed latest edit", async () => {
    const state = createCache();
    const lifecycle = createCartEditMutationLifecycle(state.cache);
    const context = await lifecycle.onMutate({ productId: matcha.id, quantity: 0 });
    lifecycle.onError(context);
    expect(state.read()).toEqual(initial);
    lifecycle.onSettled(context);
    expect(state.cache.invalidate).toHaveBeenCalledOnce();
  });

  it("preserves a newer rapid edit when an earlier request fails", async () => {
    const state = createCache();
    const lifecycle = createCartEditMutationLifecycle(state.cache);
    const first = await lifecycle.onMutate({ productId: matcha.id, quantity: 2 });
    const second = await lifecycle.onMutate({ productId: matcha.id, quantity: 3 });
    lifecycle.onError(first);
    expect(state.read().items[0]?.quantity).toBe(3);
    lifecycle.onSettled(first);
    expect(state.cache.invalidate).not.toHaveBeenCalled();
    lifecycle.onSettled(second);
    expect(state.cache.invalidate).toHaveBeenCalledOnce();
  });

  it("reconciles the final successful edit from its response without another cart query", async () => {
    const state = createCache();
    const lifecycle = createCartEditMutationLifecycle(state.cache);
    const context = await lifecycle.onMutate({ productId: matcha.id, quantity: 2 });
    const serverCart = { items: [{ ...matcha, quantity: 2 }, tiger], subtotalPesewas: 21500, deliveryFeePesewas: 0, totalPesewas: 21500 };

    lifecycle.onSuccess(serverCart);
    lifecycle.onSettled(context);

    expect(state.read()).toEqual(serverCart);
    expect(state.cache.invalidate).not.toHaveBeenCalled();
  });

  it("blocks a stale cart result after rapid quantity changes", async () => {
    const state = createCache();
    const lifecycle = createCartEditMutationLifecycle(state.cache);
    const completeStaleRead = state.startStaleRead();
    await lifecycle.onMutate({ productId: matcha.id, quantity: 2 });
    await lifecycle.onMutate({ productId: matcha.id, quantity: 3 });
    completeStaleRead();
    expect(state.events).toContain("stale-blocked");
    expect(state.read().items.find((item) => item.id === matcha.id)?.quantity).toBe(3);
  });

  it("restores only the failed line while retaining a concurrent edit to another product", async () => {
    const state = createCache();
    const lifecycle = createCartEditMutationLifecycle(state.cache);
    const failedMatchaEdit = await lifecycle.onMutate({ productId: matcha.id, quantity: 0 });
    await lifecycle.onMutate({ productId: tiger.id, quantity: 2 });
    lifecycle.onError(failedMatchaEdit);
    expect(state.read().items).toEqual([{ ...matcha, quantity: 1 }, { ...tiger, quantity: 2 }]);
    expect(state.read().totalPesewas).toBe(20500);
  });
});
