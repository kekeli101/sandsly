import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUserById: vi.fn() }));
vi.mock("./db", () => mocks);

import { createApiAccessToken, getStandaloneUser } from "./standalone-auth";

describe("standalone bearer access", () => {
  it("resolves a server-side user from a valid bounded bearer token", async () => {
    const user = { id: 960005, role: "admin" };
    mocks.getUserById.mockResolvedValue(user);
    const token = await createApiAccessToken(user);
    const req = { headers: { authorization: `Bearer ${token}` } } as never;

    await expect(getStandaloneUser(req)).resolves.toEqual(user);
    expect(mocks.getUserById).toHaveBeenCalledWith(960005);
  });

  it("does not resolve a malformed bearer credential", async () => {
    const req = { headers: { authorization: "Bearer not-a-jwt" } } as never;
    await expect(getStandaloneUser(req)).resolves.toBeNull();
  });
});
