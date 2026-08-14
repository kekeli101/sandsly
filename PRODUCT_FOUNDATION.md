# Crunch Bite Product Foundation

## Delivered Capabilities

The storefront now uses a full-stack architecture. The public menu reads from the persistent catalog service, while customer bag, checkout, profile, and order-history actions are protected behind the built-in authenticated user flow. Currency calculations are performed in integer pesewas and displayed as Ghana cedis, preventing decimal rounding errors during checkout.

| Product area | Delivered foundation |
| --- | --- |
| Customer identity | Built-in OAuth-backed user accounts with customer/admin roles. |
| Catalog | Persistent categories and products, including price, image, availability, badge, and crunch level. |
| Customer bag | One durable cart per signed-in customer, with server-side quantity updates. |
| Checkout | Order and order-item snapshots, GHS totals, delivery fee calculation, and pending order status. |
| Account | Sign-in entry, delivery profile fields, and authenticated order history. |
| Operations | Admin-only recent-order procedure ready to power an internal kitchen console. |

## Data Model

The core data model separates mutable menu records from immutable order snapshots. `categories` own `products`; signed-in users own one reusable `cart` and many `orders`; `cartItems` point to current products, while `orderItems` preserve each product name and price as of checkout. This approach keeps historical orders accurate if a menu item changes later.

## Commerce Boundary

The current checkout creates a real pending order but does **not** capture payment. The next commerce milestone should attach a payment provider and update the order-status workflow from the operations console. Delivery-zone calculation, promotion codes, customer notifications, and kitchen printer integration should follow after payment confirmation is selected.
