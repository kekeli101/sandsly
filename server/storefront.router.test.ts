import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  addCartItem: vi.fn(),
  clearCartForUser: vi.fn(),
  createOrderFromCart: vi.fn(),
  getCartForUser: vi.fn(),
  getCustomerProfile: vi.fn(),
  getOrderForTelegramNotification: vi.fn(),
  getPaystackPaymentForUser: vi.fn(),
  getPendingOnlinePaymentForUser: vi.fn(),
  listCatalog: vi.fn(),
  listOrdersForUser: vi.fn(),
  listRecentOrdersForAdmin: vi.fn(),
  markPaystackPaymentFailed: vi.fn(),
  recordVerifiedPaystackPayment: vi.fn(),
  saveCustomerAccountDetails: vi.fn(),
  attachPaystackReference: vi.fn(),
  initializePaystackTestPayment: vi.fn(),
  setCartItemQuantity: vi.fn(),
  notifyTelegramNewOrder: vi.fn(),
  verifyPaystackTestPayment: vi.fn(),
}));

vi.mock("./db", () => mocks);
vi.mock("./telegram", () => ({ notifyTelegramNewOrder: mocks.notifyTelegramNewOrder }));
vi.mock("./paystack", () => ({ initializePaystackTestPayment: mocks.initializePaystackTestPayment, verifyPaystackTestPayment: mocks.verifyPaystackTestPayment }));

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
    mocks.createOrderFromCart.mockResolvedValue({ id: 101, orderNumber: "CB-12345678-321", status: "pending", subtotalPesewas: 7500, deliveryFeePesewas: 2000, totalPesewas: 9500 });
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

  it("initializes an online Paystack test checkout from the stored order total", async () => {
    mocks.initializePaystackTestPayment.mockResolvedValue({ reference: "SANDS-101-testreference", authorizationUrl: "https://checkout.paystack.test/example" });
    mocks.attachPaystackReference.mockResolvedValue({ id: 88 });
    const caller = appRouter.createCaller(createCustomerContext());

    const order = await caller.storefront.checkout({ paymentMethod: "card" });

    expect(mocks.initializePaystackTestPayment).toHaveBeenCalledWith({ orderId: 101, orderNumber: "CB-12345678-321", email: "customer@example.com", amountPesewas: 9500, method: "card" });
    expect(mocks.attachPaystackReference).toHaveBeenCalledWith(101, "SANDS-101-testreference");
    expect(order).toMatchObject({ paymentReference: "SANDS-101-testreference", paymentAuthorizationUrl: "https://checkout.paystack.test/example" });
  });

  it("records a Paystack success only when reference, GHS currency, and amount match the owned payment", async () => {
    mocks.getPaystackPaymentForUser.mockResolvedValue({ paymentId: 88, orderId: 101, orderNumber: "CB-12345678-321", amountPesewas: 9500, status: "pending", method: "mobile_money", reference: "SANDS-101-testreference" });
    mocks.verifyPaystackTestPayment.mockResolvedValue({ reference: "SANDS-101-testreference", status: "success", amount: 9500, currency: "GHS", channel: "mobile_money" });
    mocks.recordVerifiedPaystackPayment.mockResolvedValue({ status: "successful" });
    mocks.getOrderForTelegramNotification.mockResolvedValue({ orderNumber: "CB-12345678-321", customerName: "Crunch Customer", status: "pending", subtotalPesewas: 7500, deliveryFeePesewas: 2000, totalPesewas: 9500, orderType: "delivery", paymentMethod: "mobile_money", paymentStatus: "successful", items: [] });
    const caller = appRouter.createCaller(createCustomerContext());

    const result = await caller.storefront.verifyPaystackPayment({ reference: "SANDS-101-testreference" });

    expect(result).toEqual({ orderNumber: "CB-12345678-321", status: "successful", alreadyVerified: false });
    expect(mocks.recordVerifiedPaystackPayment).toHaveBeenCalledWith(88, "SANDS-101-testreference");
    expect(mocks.notifyTelegramNewOrder).toHaveBeenCalledWith(expect.objectContaining({ paymentStatus: "successful", orderNumber: "CB-12345678-321" }));
  });

  it("does not call Paystack again for an already-successful payment", async () => {
    mocks.getPaystackPaymentForUser.mockResolvedValue({ paymentId: 88, orderId: 101, orderNumber: "CB-12345678-321", amountPesewas: 9500, status: "successful", method: "card", reference: "SANDS-101-testreference" });
    const caller = appRouter.createCaller(createCustomerContext());

    const result = await caller.storefront.verifyPaystackPayment({ reference: "SANDS-101-testreference" });

    expect(result).toEqual({ orderNumber: "CB-12345678-321", status: "successful", alreadyVerified: true });
    expect(mocks.verifyPaystackTestPayment).not.toHaveBeenCalled();
    expect(mocks.recordVerifiedPaystackPayment).not.toHaveBeenCalled();
  });

  it("rejects a Paystack result whose verified amount does not equal the stored order total", async () => {
    mocks.getPaystackPaymentForUser.mockResolvedValue({ paymentId: 88, orderId: 101, orderNumber: "CB-12345678-321", amountPesewas: 9500, status: "pending", method: "card", reference: "SANDS-101-testreference" });
    mocks.verifyPaystackTestPayment.mockResolvedValue({ reference: "SANDS-101-testreference", status: "success", amount: 9499, currency: "GHS" });
    const caller = appRouter.createCaller(createCustomerContext());

    await expect(caller.storefront.verifyPaystackPayment({ reference: "SANDS-101-testreference" })).rejects.toThrow("do not match");
    expect(mocks.recordVerifiedPaystackPayment).not.toHaveBeenCalled();
  });

  it("records an abandoned matching transaction as failed without marking the order paid", async () => {
    mocks.getPaystackPaymentForUser.mockResolvedValue({ paymentId: 88, orderId: 101, orderNumber: "CB-12345678-321", amountPesewas: 9500, status: "pending", method: "card", reference: "SANDS-101-testreference" });
    mocks.verifyPaystackTestPayment.mockResolvedValue({ reference: "SANDS-101-testreference", status: "abandoned", amount: 9500, currency: "GHS" });
    mocks.markPaystackPaymentFailed.mockResolvedValue({ status: "failed" });
    const caller = appRouter.createCaller(createCustomerContext());

    const result = await caller.storefront.verifyPaystackPayment({ reference: "SANDS-101-testreference" });

    expect(result).toEqual({ orderNumber: "CB-12345678-321", status: "failed", alreadyVerified: false });
    expect(mocks.markPaystackPaymentFailed).toHaveBeenCalledWith(88, "SANDS-101-testreference");
    expect(mocks.recordVerifiedPaystackPayment).not.toHaveBeenCalled();
  });

  it("lets the owner of a pending online-payment order retry Paystack checkout safely", async () => {
    mocks.getPendingOnlinePaymentForUser.mockResolvedValue({ paymentId: 88, orderId: 101, orderNumber: "CB-12345678-321", amountPesewas: 9500, status: "pending", method: "card" });
    mocks.initializePaystackTestPayment.mockResolvedValue({ reference: "SANDS-101-retryreference", authorizationUrl: "https://checkout.paystack.test/retry" });
    mocks.attachPaystackReference.mockResolvedValue({ id: 88 });
    const caller = appRouter.createCaller(createCustomerContext());

    const result = await caller.storefront.startPaystackPayment({ orderId: 101 });

    expect(result).toEqual({ orderNumber: "CB-12345678-321", authorizationUrl: "https://checkout.paystack.test/retry" });
    expect(mocks.attachPaystackReference).toHaveBeenCalledWith(101, "SANDS-101-retryreference");
  });
});
