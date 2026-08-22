// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { clearApiSessionToken, readApiSessionToken, saveApiSessionToken } from "../client/src/lib/api-session";

describe("browser API session transport", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("stores an API credential only for the current browser session and removes it explicitly", () => {
    expect(readApiSessionToken()).toBeNull();
    saveApiSessionToken("bounded-access-token");
    expect(readApiSessionToken()).toBe("bounded-access-token");
    clearApiSessionToken();
    expect(readApiSessionToken()).toBeNull();
  });
});
