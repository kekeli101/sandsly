import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ listKitchenOrders: vi.fn(), updateKitchenOrderStatus: vi.fn(), listMenuManagementData: vi.fn(), createMenuProduct: vi.fn(), updateMenuProduct: vi.fn(), setMenuProductActive: vi.fn() }));
vi.mock("./db", () => ({
  listKitchenOrders: mocks.listKitchenOrders,
  updateKitchenOrderStatus: mocks.updateKitchenOrderStatus,
  listMenuManagementData: mocks.listMenuManagementData,
  createMenuProduct: mocks.createMenuProduct,
  updateMenuProduct: mocks.updateMenuProduct,
  setMenuProductActive: mocks.setMenuProductActive,
  listCatalog: vi.fn(), listRecentOrdersForAdmin: vi.fn(), getCartForUser: vi.fn(), addCartItem: vi.fn(),
  setCartItemQuantity: vi.fn(), clearCartForUser: vi.fn(), createOrderFromCart: vi.fn(), getCustomerProfile: vi.fn(), saveCustomerProfile: vi.fn(),
}));

import { appRouter } from "./routers";

function contextFor(role: "user" | "kitchen" | "admin"): TrpcContext {
  return {
    user: { id: 5, openId: `test-${role}`, name: "Test Staff", email: "test@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("kitchen router", () => {
  it("rejects customer accounts and permits kitchen staff to update an order", async () => {
    mocks.listKitchenOrders.mockResolvedValue([]);
    mocks.updateKitchenOrderStatus.mockResolvedValue({ id: 8, status: "accepted" });
    await expect(appRouter.createCaller(contextFor("user")).kitchen.orders()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(contextFor("kitchen")).kitchen.updateStatus({ orderId: 8, status: "accepted" })).resolves.toEqual({ id: 8, status: "accepted" });
    expect(mocks.updateKitchenOrderStatus).toHaveBeenCalledWith(8, "accepted");
  });

  it("persists a ready order as completed for kitchen staff", async () => {
    mocks.updateKitchenOrderStatus.mockResolvedValue({ id: 21, status: "completed" });
    await expect(appRouter.createCaller(contextFor("kitchen")).kitchen.updateStatus({ orderId: 21, status: "completed" })).resolves.toEqual({ id: 21, status: "completed" });
    expect(mocks.updateKitchenOrderStatus).toHaveBeenCalledWith(21, "completed");
  });

  it("blocks customers and allows kitchen staff to manage menu products", async () => {
    const product = { id: "smoky-suya-fries", categoryId: 5, name: "Smoky Suya Fries", description: "Crispy fries", pricePesewas: 6500, imageUrl: "https://example.com/fries.jpg", badge: null, crunchLevel: 4, sortOrder: 10, isActive: true, categoryName: "Fries" };
    mocks.listMenuManagementData.mockResolvedValue({ categories: [{ id: 5, name: "Fries" }], products: [product] });
    mocks.createMenuProduct.mockResolvedValue(product);
    mocks.updateMenuProduct.mockResolvedValue({ ...product, name: "Updated Fries" });
    mocks.setMenuProductActive.mockResolvedValue({ ...product, isActive: false });
    const input = { id: "smoky-suya-fries", categoryId: 5, name: "Smoky Suya Fries", description: "Crispy fries", pricePesewas: 6500, imageUrl: "https://example.com/fries.jpg", badge: null, crunchLevel: 4, sortOrder: 10 };
    await expect(appRouter.createCaller(contextFor("user")).kitchen.menu()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(contextFor("kitchen")).kitchen.menu()).resolves.toEqual({ categories: [{ id: 5, name: "Fries" }], products: [product] });
    await expect(appRouter.createCaller(contextFor("kitchen")).kitchen.createProduct(input)).resolves.toEqual(product);
    await expect(appRouter.createCaller(contextFor("kitchen")).kitchen.updateProduct({ productId: product.id, name: "Updated Fries" })).resolves.toEqual({ ...product, name: "Updated Fries" });
    await expect(appRouter.createCaller(contextFor("kitchen")).kitchen.setProductActive({ productId: product.id, isActive: false })).resolves.toEqual({ ...product, isActive: false });
    expect(mocks.createMenuProduct).toHaveBeenCalledWith(input);
    expect(mocks.updateMenuProduct).toHaveBeenCalledWith(product.id, { name: "Updated Fries" });
    expect(mocks.setMenuProductActive).toHaveBeenCalledWith(product.id, false);
  });
});
