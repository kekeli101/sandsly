import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"));

describe("Vercel stale-asset and security configuration", () => {
  it("does not rewrite missing hashed assets to the SPA shell", () => {
    const fallback = config.rewrites.find((entry: { destination: string }) => entry.destination === "/index.html");
    expect(fallback?.source).toContain("?!assets/");
  });

  it("includes browser hardening headers on application routes", () => {
    const headers = config.headers[0].headers as Array<{ key: string; value: string }>;
    expect(headers).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "Content-Security-Policy" }),
      expect.objectContaining({ key: "X-Content-Type-Options", value: "nosniff" }),
      expect.objectContaining({ key: "Referrer-Policy" }),
      expect.objectContaining({ key: "Permissions-Policy" }),
      expect.objectContaining({ key: "X-Frame-Options", value: "DENY" }),
    ]));
  });
});
