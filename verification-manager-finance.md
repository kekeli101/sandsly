# Manager Console inventory, expense, and profit-reporting verification

## Scope and financial boundary

This release adds administrator-only inventory, recipe-cost, operating-expense, and recorded-profit capabilities to Sandsly’s existing Manager Console. All currency values are stored as integer pesewas and displayed as Ghana cedis. The implementation deliberately avoids creating sample stock, supplier bills, expenses, orders, or payments.

> **True margin is never inferred.** A fulfilled menu line is included in complete margin coverage only when Sandsly has retained its immutable recipe-cost snapshot. Older completed sales that lack such a snapshot keep the margin state partial rather than producing a false profit claim.

| Area | Verified implementation |
| --- | --- |
| Inventory | Admins can create stock items with an opening count, measurement unit, reorder point, and supplier unit cost, then append purchases, waste, and corrections to an audit trail. |
| Recipe COGS | Admins can assign measured ingredients to each dish. New orders snapshot recipe quantities and unit costs so later price changes do not alter prior-order COGS. |
| Stock usage | The Kitchen `preparing` transition appends each order’s recipe consumption once and reduces the appropriate on-hand quantities once. |
| Expenses | Admins can record dated rent, utilities, payroll, marketing, delivery, maintenance, and other operating expenses. Supplier restocks remain inventory movements to avoid double counting. |
| Profit metrics | The report calculates direct food cost from fulfilled recipe snapshots plus recorded waste, then gross result/profit, operating expenses, net result/profit, and margins from recorded inputs only. |
| Access control | Inventory, adjustment, recipe, and expense procedures use the existing server-side `adminProcedure`; customer and Kitchen callers are rejected. |

## Validation evidence

The TypeScript compiler completed successfully. Focused coverage for the Manager Console, administrator procedures, and the profit-calculation utility reported **3 test files / 7 tests passing**. The Finance Controls interaction suite added **3 JSDOM tests** for tab changes, validation feedback, successful mutation wiring, and report invalidation. The final project suite reported **31 test files / 83 tests passing**, and the production build completed successfully with the existing non-blocking bundle-size warning.

An authenticated administrator session reviewed the local Manager Console at **375 × 812**. The phone-sized view rendered COGS and recorded-waste cards, partial-margin safeguards, inventory value and low-stock readiness, plus the Inventory & Expenses panel with Stock, Recipes, and Expenses controls. The initial state correctly showed empty stock and expense records, and the page did not claim a complete profit margin.

No inventory, expenses, stock movements, order costs, orders, payments, reviews, or customer records were fabricated for this release.
