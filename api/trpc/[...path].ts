import type { IncomingMessage, ServerResponse } from "node:http";

const RENDER_API_ORIGIN = "https://sandsly.onrender.com";

type VercelRequest = IncomingMessage & { query?: Record<string, string | string[]> };

function readRawBody(req: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function forwardedHeaders(req: IncomingMessage) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (!value || name === "host" || name === "content-length") continue;
    headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  }
  headers.set("x-forwarded-host", req.headers.host ?? "sandsly.vercel.app");
  headers.set("x-forwarded-proto", "https");
  return headers;
}

export async function proxyTrpcRequest(req: IncomingMessage, res: ServerResponse, fetcher = fetch) {
  const method = req.method ?? "GET";
  const target = new URL(req.url ?? "/api/trpc", RENDER_API_ORIGIN);
  const rawBody = method === "GET" || method === "HEAD" ? undefined : await readRawBody(req);
  const response = await fetcher(target, {
    method,
    headers: forwardedHeaders(req),
    body: rawBody?.length ? rawBody : undefined,
    redirect: "manual",
  });

  res.statusCode = response.status;
  for (const [name, value] of response.headers.entries()) {
    if (name.toLowerCase() !== "set-cookie") res.setHeader(name, value);
  }
  const cookies = typeof (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === "function"
    ? (response.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
    : response.headers.get("set-cookie") ? [response.headers.get("set-cookie")!] : [];
  if (cookies.length) res.setHeader("set-cookie", cookies);
  res.end(Buffer.from(await response.arrayBuffer()));
}

export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: ServerResponse) {
  try {
    await proxyTrpcRequest(req, res);
  } catch (error) {
    console.error("[Vercel tRPC proxy]", error instanceof Error ? error.message : "unknown error");
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "The Sandsly API is temporarily unavailable." }));
    }
  }
}
