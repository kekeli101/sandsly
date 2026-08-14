import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDevelopmentDemoUser: vi.fn() }));
vi.mock("./db", () => mocks);

import { DEMO_PASSWORD, DEMO_SESSION_KEY, DEMO_USERNAME, validateDemoLogin } from "./demo-auth";

describe("development demo authentication", () => {
  it("accepts only the documented development credentials and returns a demo session key", async () => {
    const user = { id: 99, openId: "development-demo-customer" };
    mocks.getDevelopmentDemoUser.mockResolvedValue(user);

    await expect(validateDemoLogin(DEMO_USERNAME, DEMO_PASSWORD)).resolves.toEqual({ sessionKey: DEMO_SESSION_KEY, user });
    await expect(validateDemoLogin(DEMO_USERNAME, "not-the-password")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
