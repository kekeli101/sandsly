# Mobile UI verification

## Audit

At 375 × 812, the public Home and Menu routes retain the dark orange The Crunch Bite visual system, compact header, side-menu entry, two-column quick-hit categories, global menu search, horizontal category affordance, and tappable product actions. Cart, Kitchen access, and Manager lock screens remain within the viewport.

## Responsive fixes verified

The unauthenticated Account form now has a full-width sign-in button inside its card instead of a compact button that crowded the recovery and staff links. The Cart fulfillment choices stack vertically on phones and retain two columns from the `sm` breakpoint upward. Kitchen refresh actions occupy the available phone width, and menu-management price/badge and crunch/sort fields stack on phones before returning to two columns at `sm`. Finance Controls summary cards, inventory quantity/reorder fields, recipe ingredient entry, and expense amount/date fields stack on phones to prevent cramped controls.

## Scope

This verification is visual and non-destructive. No customer, order, payment, inventory, expense, or menu records were created or changed.

## Wide-layout cross-check

At 1280 × 720, Home, Menu, Profile, and Cart retained their persistent staff/customer sidebar, two-column menu grid, centered account form, and wide empty-bag card. The phone-only stacking rules activate below the small breakpoint and do not compress the desktop composition.

The latest local visual review covered `/profile`, `/cart`, `/menu`, `/kitchen`, and `/admin` at 375 × 812, followed by `/`, `/menu`, `/profile`, and `/cart` at 1280 × 720. No visible horizontal overflow was observed in the reviewed states.
