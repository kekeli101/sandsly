import { Home, QrCode, UserRound, Utensils } from "lucide-react";

export const storefrontNavigationItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Menu", href: "/menu", icon: Utensils },
  { label: "Rewards", href: "/rewards", icon: QrCode },
  { label: "Profile", href: "/profile", icon: UserRound },
] as const;

export function isStorefrontRouteActive(location: string, href: string) {
  return href === "/" ? location === "/" : location.startsWith(href);
}
