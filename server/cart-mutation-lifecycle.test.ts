import { describe, expect, it, vi } from "vitest";
import { createCartMutationLifecycle } from "../client/src/lib/cart-mutation-lifecycle";

const matcha = { id: "matcha-cloud-boba", name: "Matcha Cloud Boba", description: "Matcha", pricePesewas: 7500, imageUrl: "https://example.com/matcha.jpg", badge: null, crunchLevel: 2, categorySlug: "boba", categoryName: "Boba", sortOrder: 1 };
const tiger = { ...matcha, id: "tiger-sugar-boba", name: "Tiger Sugar Boba", pricePesewas: 6500 };

function createCache(initial = { items: [], subtotalPesewas: 0, deliveryFeePesewas: 0, totalPesewas: 0 }) {
  let value = initial;
  const events: string[] = [];
  let cancelGeneration = 0;
  const cache = {
    cancel: vi.fn(async () => { cancelGeneration += 1; events.push("cancel"); }),
    getData: vi.fn(() => value),
    setData: vi.fn((next) => { events.push("set"); value = next; }),
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

describe("CartContext optimistic mutation lifecycle", () => {
  it("cancels a pending cart read before applying an immediate optimistic addition", async () => {
    const state = createCache();
    const lifecycle = createCartMutationLifecycle(state.cache);
    lifecycle.enqueue(matcha);
    await lifecycle.onMutate();
    expect(state.cache.cancel).toHaveBeenCalledOnce();
    expect(state.events.slice(0, 2)).toEqual(["cancel", "set"]);
    expect(state.read().items[0]).toEqual(expect.objectContaining({ id: matcha.id, quantity: 1 }));
  });

  it("restores the exact pre-mutation snapshot on failure and reconciles when pending work settles", async () => {
    const initial = { items: [{ ...matcha, quantity: 2 }], subtotalPesewas: 15000, deliveryFeePesewas: 2000, totalPesewas: 17000 };
    const state = createCache(initial);
    const lifecycle = createCartMutationLifecycle(state.cache);
    lifecycle.enqueue(tiger);
    const context = await lifecycle.onMutate();
    lifecycle.onError(context);
    expect(state.read()).toEqual(initial);
    lifecycle.onSettled();
    expect(state.cache.invalidate).toHaveBeenCalledOnce();
  });

  it("uses the final successful response directly instead of adding a trailing cart fetch", async () => {
    const state = createCache();
    const lifecycle = createCartMutationLifecycle(state.cache);
    lifecycle.enqueue(matcha);
    await lifecycle.onMutate();
    const serverCart = { items: [{ ...matcha, quantity: 1 }], subtotalPesewas: 7500, deliveryFeePesewas: 0, totalPesewas: 7500 };

    lifecycle.onSuccess(serverCart);
    lifecycle.onSettled();

    expect(state.read()).toEqual(serverCart);
    expect(state.cache.invalidate).not.toHaveBeenCalled();
  });

  it("keeps two rapid additions ahead of stale cart reads without an extra success-path refetch", async () => {
    const state = createCache();
    const lifecycle = createCartMutationLifecycle(state.cache);
    const completeStaleRead = state.startStaleRead();
    lifecycle.enqueue(matcha);
    lifecycle.enqueue(matcha);

    await lifecycle.onMutate();
    await lifecycle.onMutate();

    expect(state.cache.cancel).toHaveBeenCalledTimes(2);
    expect(state.read().items).toEqual([expect.objectContaining({ id: matcha.id, quantity: 2 })]);
    completeStaleRead();
    expect(state.events).toContain("stale-blocked");
    expect(state.read().items).toEqual([expect.objectContaining({ id: matcha.id, quantity: 2 })]);

    lifecycle.onSettled();
    expect(state.cache.invalidate).not.toHaveBeenCalled();
    lifecycle.onSettled();
    expect(state.cache.invalidate).not.toHaveBeenCalled();
  });
});
