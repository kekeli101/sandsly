# Kitchen Menu Management Verification

## Authenticated staff UI

On 18 Aug 2026, the local Kitchen staff session for `kitchen@mail.com` successfully opened `/kitchen` and selected **Manage menu**. The section rendered the add-dish form with name, active category, description, Ghana Cedi price, badge, image URL, crunch level, and sort order fields. It also rendered all 13 existing menu products with responsive product cards and **Edit** and **Remove** actions.

The Kitchen router tests verify that normal customer accounts receive `FORBIDDEN` for menu-management procedures, while Kitchen staff can list, create, update, and toggle product availability.

## Reversible customer catalog visibility check

With explicit approval, Matcha Cloud Boba was temporarily soft-deactivated directly in Supabase and the active customer catalog query confirmed it was hidden. The product was then restored immediately, and the same query confirmed it reappeared. The original active state was restored before the temporary verification script was removed.

## End-to-end staff control verification

With approval, the authenticated Kitchen session created a clearly labeled temporary product, `UI Verification Boba`, raising the staff catalog from 13 to 14 live dishes. The UI then opened that product in edit mode, saved an updated description, soft-removed it (showing 14 dishes with 13 live and a **Restore** control), and restored it (14 live dishes). The temporary product was then permanently removed through a narrowly scoped cleanup script because it had no order history or cart references, returning the catalog to its original 13-item state. The temporary scripts were removed after use.

After a staff-side refresh, the Kitchen console again displayed **13 dishes** and **13 live**, confirming the temporary verification record was fully cleaned up.
