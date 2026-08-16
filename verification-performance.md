# Sandsly Performance Verification

## Baseline captured 16 Aug 2026

The live Vercel HTML shell responded in approximately 0.28–0.30 seconds with a 672-byte document. The live Vercel catalog tRPC request responded in approximately 1.28 seconds and returned 5,572 bytes. The Render health endpoint responded in approximately 5.43 seconds during a cold request, indicating autosleep/cold-start latency separate from frontend rendering.

The six generated expanded-menu photos were each approximately 4.47–5.50 MB before optimization. The first two measured files were 4,861,737 bytes and 4,850,725 bytes, compared with approximately 146,973 bytes for a 900px Unsplash menu image.

## Optimization targets

The six generated menu photos were resized to 800x1000 and recompressed at JPEG quality 76, producing payloads between 93,106 and 154,937 bytes. The Supabase seed now references the compressed public CDN URLs. Product cards use native lazy loading and asynchronous decoding; Home prioritizes only the hero image and lazily loads quick-hit imagery. Home and Menu cache the catalog for five minutes in the browser, while the server caches the public catalog for five minutes per process to reduce repeated Supabase reads.

## Verification after optimization

The 375px Home, Menu/Boba, and protected Kitchen routes rendered correctly after route-level lazy loading. The initial JavaScript bundle decreased from 791.05 kB minified (224.76 kB gzip) to 636.14 kB minified (191.69 kB gzip), while Home, Menu, Cart, Account, and KitchenDashboard moved into separate route chunks. TypeScript checks and all 13 tests pass.
