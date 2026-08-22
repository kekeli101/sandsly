# Manager Console Vercel deployment diagnosis

On 2026-08-22, the Vercel production deployment for Sandsly was inspected while repairing the authenticated Manager Console route. The deployment was ready but reported **zero function invocations**, and a harmless `POST` to `/api/trpc/auth.login` returned HTTP 405 with the static `index.html` response. This established that the SPA fallback, not the added API proxy function, was serving the route.

The Vercel project’s production settings showed the **Vite** framework preset, a `pnpm build:client` build command, and `dist/public` static output. Vercel’s Vite guidance describes Vite as producing static assets and notes that a Vite project needs an additional supported backend approach to use functions. [1] The Vercel Functions guidance confirms that functions are intended to serve server-side request handlers, including authentication and API work. [2]

An explicit serverless proxy was attempted after changing the project Framework Preset to **Other**, but Vercel continued to emit a static-only artifact with zero function invocations. The project already had a proven Vercel external rewrite for the standalone Render API, so the configuration was returned to that rewrite rather than leaving an inactive proxy path in production. The next verification step is a fresh administrator sign-in through the restored rewrite and a successful authenticated `admin.console` query.

## References

[1]: https://vercel.com/docs/frameworks/frontend/vite "Vite on Vercel"
[2]: https://vercel.com/docs/functions "Vercel Functions"
