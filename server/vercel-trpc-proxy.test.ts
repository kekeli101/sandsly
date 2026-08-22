import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { proxyTrpcRequest } from "../api/trpc/[...path]";

function responseRecorder() {
  const headers = new Map<string, string | string[]>();
  return {
    statusCode: 0,
    body: Buffer.alloc(0),
    headers,
    setHeader(name: string, value: string | string[]) { headers.set(name.toLowerCase(), value); },
    end(value?: Buffer) { this.body = value ?? Buffer.alloc(0); },
  };
}

describe("Vercel tRPC proxy", () => {
  it("forwards the same-origin session cookie to Render and returns its Set-Cookie response", async () => {
    const req = Object.assign(new EventEmitter(), {
      method: "GET",
      url: "/api/trpc/admin.console?batch=1&input=%7B%7D",
      headers: { host: "sandsly.vercel.app", cookie: "sandsly_session=browser-token", accept: "application/json" },
    });
    const res = responseRecorder();
    const fetcher = vi.fn(async (url: URL, init?: RequestInit) => {
      expect(url.toString()).toBe("https://sandsly.onrender.com/api/trpc/admin.console?batch=1&input=%7B%7D");
      expect(new Headers(init?.headers).get("cookie")).toBe("sandsly_session=browser-token");
      expect(new Headers(init?.headers).get("x-forwarded-host")).toBe("sandsly.vercel.app");
      return new Response('{"result":{"data":null}}', { status: 200, headers: { "content-type": "application/json", "set-cookie": "sandsly_session=renewed; Path=/; HttpOnly" } });
    });

    await proxyTrpcRequest(req as never, res as never, fetcher);

    expect(res.statusCode).toBe(200);
    expect(res.headers.get("set-cookie")).toEqual(["sandsly_session=renewed; Path=/; HttpOnly"]);
    expect(res.body.toString()).toContain("result");
  });
});
