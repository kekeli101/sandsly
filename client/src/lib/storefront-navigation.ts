import { Home, QrCode, UserRound, Utensils } from "lucide-react";

export const storefrontNavigationItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Menu", href: "/menu", icon: Utensils },
  { label: "Profile", href: "/profile", icon: UserRound },
] as const;

export function isStorefrontRouteActive(location: string, href: string) {
  return href === "/" ? location === "/" : location.startsWith(href);
}

export function getPrimaryOrderAction(itemCount: number) {
  return itemCount > 0 ? { destination: "/cart", label: "View bag" } : { destination: "/menu", label: "Order now" };
}
