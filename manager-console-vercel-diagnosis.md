# Manager Console Vercel deployment diagnosis

On 2026-08-22, the Vercel production deployment for Sandsly was inspected while repairing the authenticated Manager Console route. The deployment was ready but reported **zero function invocations**, and a harmless `POST` to `/api/trpc/auth.login` returned HTTP 405 with the static `index.html` response. This established that the SPA fallback, not the added API proxy function, was serving the route.

The Vercel project’s production settings showed the **Vite** framework preset, a `pnpm build:client` build command, and `dist/public` static output. Vercel’s Vite guidance describes Vite as producing static assets and notes that a Vite project needs an additional supported backend approach to use functions. [1] The Vercel Functions guidance confirms that functions are intended to serve server-side request handlers, including authentication and API work. [2]

The approved remediation is to change the project Framework Preset from **Vite** to **Other** while preserving the repository-managed build and static-output configuration, so the explicit same-origin `/api/trpc` proxy can deploy alongside the SPA. The configuration change has not been claimed as complete until the refreshed deployment serves the proxy and the authenticated administrator query succeeds.

## References

[1]: https://vercel.com/docs/frameworks/frontend/vite "Vite on Vercel"
[2]: https://vercel.com/docs/functions "Vercel Functions"
