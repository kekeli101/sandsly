import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { readApiSessionToken } from "./lib/api-session";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: { retry: 0 },
  },
});
const configuredApiUrl = (import.meta.env.VITE_API_URL ?? "").trim();
const apiBaseUrl = (configuredApiUrl || (import.meta.env.DEV ? "" : "https://sandsly.onrender.com")).replace(/\/+$/, "");
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${apiBaseUrl}/api/trpc`,
      transformer: superjson,
      fetch(input, init) {
        const headers = new Headers(init?.headers);
        const token = readApiSessionToken();
        if (token) headers.set("authorization", `Bearer ${token}`);
        return globalThis.fetch(input, { ...(init ?? {}), headers, credentials: "include" });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
