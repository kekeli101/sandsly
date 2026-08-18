# Sandsly Restaurant Platform — Client Progress Report

**Product:** The Crunch Bite on Sandsly  
**Reporting date:** 18 August 2026  
**Live storefront:** https://sandsly.vercel.app

## Executive summary

The Sandsly restaurant platform has progressed from a mobile-first menu MVP into a standalone ordering and restaurant-operations product. Customers can browse the menu in Ghana Cedis, build a cart, choose pickup or delivery, select an offline payment method, and follow their order status. Kitchen and Admin staff have dedicated, role-protected operational tools for handling orders, managing menu items, and monitoring restaurant activity.

The current product is deployed independently with a Vercel storefront, Render API, and Supabase database and image storage. Recent work also improved customer responsiveness: adding an item to the bag now confirms instantly, updates the bag count immediately, and safely reconciles with the server in the background.

## Delivered capabilities

| Area | Delivered outcome | Client value |
| --- | --- | --- |
| Customer ordering | Category browsing, menu search, Ghana Cedi pricing, cart management, pickup/delivery selection, kitchen notes, and checkout | Customers can place complete restaurant orders from mobile or desktop. |
| Delivery and payments | Delivery contact/address validation; cash-on-pickup, cash-on-delivery, Mobile Money pending, and card pending options | The restaurant can distinguish fulfilment and payment context before a live gateway is introduced. |
| Order tracking | Customer profile with order details, payment state, fulfilment type, and status timeline | Customers can see what is happening after checkout. |
| Kitchen operations | Five-second live board refresh, Active/Completed views, pickup and delivery workflows, delivery details, and payment context | Staff can manage preparation and handoff without manual page refreshes. |
| Admin operations | Protected dashboard with order, sales, customer, popular-dish, and recent-order metrics | Management has a single operational overview. |
| Menu management | Kitchen/Admin creation, editing, soft removal/restoration, and device image uploads | Staff can maintain the live catalog without requiring external image links or developer support. |
| Messaging | Telegram new-order alerts with items, payment state, fulfilment type, and delivery details | The team receives actionable new-order notifications in the configured group. |
| Mobile experience | Side-menu navigation, no mobile bottom bar, responsive public and staff views, and a Rewards coming-soon page | The primary experience is designed for phone-sized screens. |
| Performance and reliability | Lazy-loaded routes/images, catalog caching, responsive add-to-bag feedback, role checks, and order-status audit history | Faster customer interactions and clearer operational accountability. |

## Recent completed improvements

| Recent release | What changed | Validation completed |
| --- | --- | --- |
| SRS-aligned ordering release | Added pickup/delivery data, payment records, delivery status flow, customer timelines, Admin reporting, menu search, and enriched Telegram alerts | Database migration was applied to Supabase; responsive reviews and automated coverage were completed. |
| Mobile navigation release | Replaced the phone bottom bar with the three-line side menu and published Rewards as a coming-soon page | Phone navigation was verified with the product owner. |
| Telegram reliability release | Diagnosed missing Render environment variables, restored deployment configuration, and added clearer delivery logs | Bot/chat access, a labelled integration message, and a real checkout notification were confirmed. |
| Menu image-upload release | Replaced URL-only image entry with Kitchen/Admin device file selection and Supabase Storage persistence | Verified live upload preview, public catalog image rendering, file validation, authorization, and cleanup of the verification item. |
| Cart responsiveness release | Added immediate add-to-bag confirmation and optimistic cart updates with rollback/reconciliation safeguards | Verified live first and repeated taps, accurate cart count/total changes, and restoration of the test cart. |

## Quality and operational status

The product has **31 automated tests across 15 test files** covering core ordering, access control, checkout rules, delivery lifecycle, Telegram integration, Supabase connectivity/storage, menu-image validation, and cart mutation safety. TypeScript validation, production builds, and whitespace checks pass for the latest release.

> The live platform is operational for menu browsing, offline-payment order capture, staff fulfilment, Telegram order alerts, and menu maintenance. Mobile Money and card selections are currently recorded as **pending** rather than charged, pending selection of a payment provider.

## Recommended future improvements

| Priority | Improvement | Why it matters | Dependency / decision needed |
| --- | --- | --- | --- |
| 1 | Live Mobile Money and card payment collection | Enables paid online checkout and payment confirmation | Select Hubtel, Paystack, or another provider; provide credentials and settlement policy. |
| 1 | Email-based password recovery and password visibility controls | Improves account recovery and sign-in usability | Configure a verified transactional email sender and From address. |
| 2 | Email/SMS order-status notifications | Keeps customers informed without requiring them to reopen the site | Select an email/SMS provider and message policy. |
| 2 | Delivery staff role and assignment queue | Enables structured dispatch, rider accountability, and delivery ownership | Define staff roles, assignment rules, and delivery operating process. |
| 3 | Discounts, loyalty points, and coupon codes | Supports repeat purchases and campaign management | Agree promotional rules, eligibility, and accounting approach. |
| 3 | Customer-management tools | Allows staff to search customer history and resolve service issues faster | Define privacy/access policy for staff. |
| 4 | Inventory, low-stock rules, and advanced reporting | Helps prevent unavailable-item orders and supports management planning | Define stock workflow, suppliers, and reporting requirements. |
| 4 | Observability and backup routine | Improves incident response and business continuity as order volume grows | Establish operational owner, retention period, and notification thresholds. |

## Suggested next step

The most valuable next investment is **selecting and integrating the live payment provider**, followed by email-based account recovery and customer order-status notifications. These additions would convert the existing, operational order-management workflow into a more complete online commerce experience while retaining the current Kitchen and Admin processes.

## Report basis

This report is based on the current Sandsly implementation, release verification records, latest production interaction checks, and the documented SRS coverage plan. It reflects the system state as of 18 August 2026.
