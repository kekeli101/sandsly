<!--
Design source: supplied Sandsly.zip reference screens for The Crunch Bite restaurant.
This document is the ground-truth visual and interaction spec for the MVP build.
When in doubt: does this choice reinforce or dilute the reference's high-contrast street-food energy?
-->

# Sandsly MVP — Reference Ground Truth

## Design Direction

This is a direct mobile-first recreation of the supplied **The Crunch Bite** restaurant reference, not a new visual exploration. The experience is intentionally dark, loud, compact, and food-forward: near-black surfaces create a stage for saturated orange actions, editorial food photography, and oversized display type.

## Ground-Truth Visual Spec

- **Viewport priority:** 390px mobile canvas first; desktop is a restrained expansion of the same structure.
- **Base surfaces:** near-black page background with charcoal content cards and subtle graphite borders.
- **Signature color:** hot tangerine orange used for the wordmark, active tabs, primary CTAs, badges, price accents, and focus states.
- **Typography:** condensed, heavy display face for brand and headings; neutral readable sans-serif for descriptions, labels, and utility text.
- **Geometry:** compact 14–18px card corners, pill controls for category tabs, square-ish icon buttons, and a fixed bottom navigation on mobile.
- **Photography:** dramatic low-key food imagery with black backgrounds, warm highlights, crisp close-ups, and strong subject isolation.
- **Texture:** matte black/graphite layers, thin low-contrast rules, tiny uppercase labels, and restrained grain-like depth rather than gradients.
- **Navigation:** compact top bar on menu/cart views; fixed bottom nav with Home, Menu, Rewards, and Profile; cart icon with a quantity badge.
- **Motion:** short, tactile transitions for tabs, cart drawer, toast feedback, and add-to-cart controls. Respect reduced-motion preferences.

## MVP Scope

1. Home page with brand hero, featured quick hits, trending item cards, and a primary order CTA.
2. Menu page with category tabs for Savory, Boba & Sweets, and Sides; item cards with image, description, price, crunch level, and add-to-cart action.
3. Cart page/drawer with quantity controls, subtotal, and a checkout CTA that presents a clear MVP confirmation state.
4. Mobile navigation between Home, Menu, Rewards, and Profile. Rewards and Profile are lightweight placeholder states with honest “coming soon” copy rather than fake data.
5. Responsive behavior that preserves the mobile hierarchy and expands into a centered two-column menu layout on larger screens.

## Brand Voice

Short, punchy, street-food copy. Use lines such as “Stay crunchy.”, “Big flavor. Zero chill.”, and “Pick your next bite.” Avoid generic restaurant filler.

## Logo / Wordmark

Use a custom typographic treatment for “THE CRUNCH BITE” with uppercase condensed lettering and orange emphasis. Pair it with a simple orange bite-notch mark for the favicon and compact icon contexts; never render the logo as a default unstyled heading.

## Interaction Philosophy

Every primary action should feel immediate and edible: the selected category snaps into orange, add-to-cart increments the badge and surfaces a toast, and the cart stays one tap away. Placeholder areas are transparent about their MVP status.

## Animation Notes

Use 160–240ms ease-out transitions for button press, tab selection, card hover/lift, cart sheet entry, and quantity updates. Entrance reveals should be subtle and limited to opacity/transform. Do not animate layout dimensions or use long decorative loops.

## Additional Reference Findings

- **Cart screen:** uses a warm near-black header with a back arrow and centered orange “YOUR BAG” label; cart lines are charcoal cards with product thumbnail, serif-ish item title treatment, orange price, pill quantity stepper, and pale trash icon.
- **Cart actions:** “ADD NOTE” and “PROMO CODE” sit as two compact secondary buttons above the order summary; a sticky footer keeps the orange CHECKOUT CTA visible while the summary scrolls.
- **Menu screen:** the header keeps a left hamburger, centered orange wordmark, and right cart icon; the category tabs are horizontally scrollable and the active tab is orange.
- **Menu cards:** each item leads with a dark food image, a small badge such as BEST SELLER / NEW / HOT, then a charcoal body with bold item name, orange price, short description, crunch-level indicator, and a clear add action.
- **Bottom navigation:** four destinations remain visible on mobile with icon + uppercase label; the active item is an orange rounded rectangle, not just an icon color change.
