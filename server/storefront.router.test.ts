import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  addCartItem: vi.fn(),
  clearCartForUser: vi.fn(),
  createOrderFromCart: vi.fn(),
  getCartForUser: vi.fn(),
  getCustomerProfile: vi.fn(),
  listCatalog: vi.fn(),
  listOrdersForUser: vi.fn(),
  listRecentOrdersForAdmin: vi.fn(),
  saveCustomerAccountDetails: vi.fn(),
  setCartItemQuantity: vi.fn(),
  notifyTelegramNewOrder: vi.fn(),
}));

vi.mock("./db", () => mocks);
vi.mock("./telegram", () => ({ notifyTelegramNewOrder: mocks.notifyTelegramNewOrder }));

import { appRouter } from "./routers";

function createCustomerContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "customer-open-id",
      name: "Crunch Customer",
      email: "customer@example.com",
      loginMethod: "password",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("storefront protected procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.addCartItem.mockResolvedValue({ items: [] });
    mocks.createOrderFromCart.mockResolvedValue({ orderNumber: "CB-12345678-321", status: "pending", subtotalPesewas: 7500, deliveryFeePesewas: 2000, totalPesewas: 9500 });
    mocks.notifyTelegramNewOrder.mockResolvedValue({ delivered: true });
  });

  it("adds items and creates an order for the authenticated customer only", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    await caller.storefront.addToCart({ productId: "matcha-cloud-boba", quantity: 2 });
    const order = await caller.storefront.checkout({ customerNote: "Less ice" });

    expect(mocks.addCartItem).toHaveBeenCalledWith(42, "matcha-cloud-boba", 2);
    expect(mocks.createOrderFromCart).toHaveBeenCalledWith(42, { customerNote: "Less ice", orderType: "pickup", paymentMethod: "cash_on_pickup" });
    expect(order).toMatchObject({ orderNumber: "CB-12345678-321", totalPesewas: 9500 });
  });

  it("updates only the signed-in customer’s display and delivery details", async () => {
    mocks.saveCustomerAccountDetails.mockResolvedValue({ displayName: "Ama Mensah", phone: "024 000 0000", defaultAddress: "Osu, Accra" });
    const caller = appRouter.createCaller(createCustomerContext());
    const profile = await caller.storefront.saveProfile({ displayName: "Ama Mensah", phone: "024 000 0000", defaultAddress: "Osu, Accra" });

    expect(mocks.saveCustomerAccountDetails).toHaveBeenCalledWith(42, { displayName: "Ama Mensah", phone: "024 000 0000", defaultAddress: "Osu, Accra" });
    expect(profile).toMatchObject({ displayName: "Ama Mensah", defaultAddress: "Osu, Accra" });
  });
});
