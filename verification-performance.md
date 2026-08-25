# Sandsly Performance Verification

## Baseline captured 16 Aug 2026

The live Vercel HTML shell responded in approximately 0.28–0.30 seconds with a 672-byte document. The live Vercel catalog tRPC request responded in approximately 1.28 seconds and returned 5,572 bytes. The Render health endpoint responded in approximately 5.43 seconds during a cold request, indicating autosleep/cold-start latency separate from frontend rendering.

The six generated expanded-menu photos were each approximately 4.47–5.50 MB before optimization. The first two measured files were 4,861,737 bytes and 4,850,725 bytes, compared with approximately 146,973 bytes for a 900px Unsplash menu image.

## Optimization targets

The six generated menu photos were resized to 800x1000 and recompressed at JPEG quality 76, producing payloads between 93,106 and 154,937 bytes. The Supabase seed now references the compressed public CDN URLs. Product cards use native lazy loading and asynchronous decoding; Home prioritizes only the hero image and lazily loads quick-hit imagery. Home and Menu cache the catalog for five minutes in the browser, while the server caches the public catalog for five minutes per process to reduce repeated Supabase reads.

## Verification after optimization

The 375px Home, Menu/Boba, and protected Kitchen routes rendered correctly after route-level lazy loading. The initial JavaScript bundle decreased from 791.05 kB minified (224.76 kB gzip) to 636.14 kB minified (191.69 kB gzip), while Home, Menu, Cart, Account, and KitchenDashboard moved into separate route chunks. TypeScript checks and all 13 tests pass.

## Interaction-responsiveness pass — 25 Aug 2026

The production shell remained quick to respond: a fresh Vercel Home request reached first byte in approximately **0.29 seconds**, while the Render health endpoint took approximately **4.10 seconds** to first byte during a cold request. The latter remains an autoscaling/cold-start characteristic of the external API tier, so this pass focuses on ensuring the interface reacts immediately and avoids adding needless requests while the API is warming.

| Improvement | Result |
| --- | --- |
| Route intent preloading | Home, side navigation, cart, and staff actions begin loading the likely next route on pointer or keyboard intent. A 375 × 812 local mobile review transitioned from Home to Menu in **324 ms** without showing the route fallback. |
| Query freshness | Shared query defaults now keep recent data warm for 30 seconds, prevent unnecessary focus refetches, retry reads once, and retain cache data for ten minutes. Cart data remains warm for 60 seconds. |
| Customer flow | New authentication no longer immediately refetches the same session; completed order history stops polling, while active orders still refresh every 15 seconds. Successful checkout clears the local bag and changes route before background cart/order refreshes finish. |
| Kitchen and Manager Console | Kitchen status changes update the board optimistically with rollback and background reconciliation. Kitchen continues its five-second live poll without a duplicate focus request. Manager reporting preserves its 30-second refresh without a duplicate focus request. |
| Bag editing | The final successful add or quantity response now reconciles the optimistic cart directly, avoiding an extra trailing cart fetch. Error paths retain the previous rollback-and-refetch safeguard. |

The 375 × 812 Home and Menu surfaces retained their mobile hierarchy after the changes. Focused interaction coverage passed for checkout transition, cart reconciliation, route preloading, order polling, Kitchen behavior, and Manager Console rendering. The full validation passed with **33 test files / 90 tests**, TypeScript checks, and a production build. The production build retains the existing non-blocking initial-chunk warning (approximately 645 kB minified); route-specific chunks remain split.
