# QA remediation implementation sources

The stale-lazy-asset and security-header remediation follows Vercel’s current configuration guidance.

| Source | Implementation use |
| --- | --- |
| [Vercel `vercel.json` configuration](https://vercel.com/docs/project-configuration/vercel-json) | Defines ordered rewrites and path-based response headers. The project uses an asset-excluding SPA fallback and applies browser security headers to application routes rather than immutable asset paths. |
| [Vercel rewrites documentation](https://vercel.com/docs/routing/rewrites) | Documents regex and named-path rewrite patterns. The project excludes `/assets/` from the SPA fallback so a missing hashed JavaScript file returns a missing-asset response rather than `index.html`. |
