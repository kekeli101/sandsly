# Mobile Navigation Verification

## Scope

The fixed mobile bottom navigation bar was removed. The primary customer routes are now available from the three-line menu in the header: Home, Menu, Rewards, and Profile. The cart remains directly accessible from the header because it is a checkout action rather than primary navigation.

## Verification record

At a 375×812 phone viewport, screenshots confirmed that the Home and Rewards routes render without the previous bottom navigation bar. The Rewards route displays an explicit **Coming soon** message and does not present unavailable points, rewards, or redemption data as functional.

The project owner additionally confirmed that the mobile three-line menu opens and that its Home, Menu, Rewards, and Profile links navigate correctly. This confirmation was recorded on 18 August 2026.

## Deferred account recovery

Password visibility and email-based recovery remain on hold. A production recovery journey will require a configured transactional sender, an approved From address, single-use expiring reset links, and non-enumerating confirmation responses.
