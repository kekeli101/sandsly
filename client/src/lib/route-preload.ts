type RouteLoader = () => Promise<unknown>;

export const routeLoaders = {
  account: () => import("../pages/Account"),
  admin: () => import("../pages/AdminDashboard"),
  cart: () => import("../pages/Cart"),
  home: () => import("../pages/Home"),
  kitchen: () => import("../pages/KitchenDashboard"),
  menu: () => import("../pages/Menu"),
  notFound: () => import("../pages/NotFound"),
  paymentReturn: () => import("../pages/PaymentReturn"),
  placeholder: () => import("../pages/Placeholder"),
  resetPassword: () => import("../pages/ResetPassword"),
} satisfies Record<string, RouteLoader>;

/** Start fetching likely next screens on intent; Vite reuses the same dynamic-import cache during navigation. */
export function preloadRoute(path: string) {
  if (path === "/" || path.startsWith("/home")) return routeLoaders.home();
  if (path.startsWith("/menu")) return routeLoaders.menu();
  if (path.startsWith("/cart")) return routeLoaders.cart();
  if (path.startsWith("/profile")) return routeLoaders.account();
  if (path.startsWith("/kitchen")) return routeLoaders.kitchen();
  if (path.startsWith("/admin")) return routeLoaders.admin();
  if (path.startsWith("/rewards")) return routeLoaders.placeholder();
  if (path.startsWith("/payment")) return routeLoaders.paymentReturn();
  if (path.startsWith("/reset-password")) return routeLoaders.resetPassword();
  return routeLoaders.notFound();
}
