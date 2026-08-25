// Style reminder: preserve the reference's dark restaurant shell across every route and keep public storefront routes shallow.

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import AppShell from "./components/AppShell";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { routeLoaders } from "./lib/route-preload";

const Account = lazy(routeLoaders.account);
const AdminDashboard = lazy(routeLoaders.admin);
const Cart = lazy(routeLoaders.cart);
const Home = lazy(routeLoaders.home);
const KitchenDashboard = lazy(routeLoaders.kitchen);
const Menu = lazy(routeLoaders.menu);
const NotFound = lazy(routeLoaders.notFound);
const Placeholder = lazy(routeLoaders.placeholder);
const PaymentReturn = lazy(routeLoaders.paymentReturn);
const ResetPassword = lazy(routeLoaders.resetPassword);

function Rewards() { return <Placeholder kind="rewards" />; }
function RouteFallback() { return <div className="min-h-screen bg-[#0b0b0b] px-5 py-8" aria-label="Loading page"><div className="mx-auto max-w-[1180px] animate-pulse"><div className="h-5 w-28 rounded bg-[#272321]" /><div className="mt-5 h-12 max-w-md rounded bg-[#2d2825]" /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div className="h-56 rounded-[16px] bg-[#24211f]" /><div className="h-56 rounded-[16px] bg-[#24211f]" /><div className="h-56 rounded-[16px] bg-[#24211f]" /></div></div></div>; }
function StorefrontRouter() { return <AppShell><Switch><Route path="/" component={Home} /><Route path="/menu" component={Menu} /><Route path="/menu/:category" component={Menu} /><Route path="/cart" component={Cart} /><Route path="/payment/verify" component={PaymentReturn} /><Route path="/rewards" component={Rewards} /><Route path="/profile" component={Account} /><Route path="/staff" component={Account} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></AppShell>; }
function Router() { return <Switch><Route path="/admin" component={AdminDashboard} /><Route path="/kitchen" component={KitchenDashboard} /><Route path="/reset-password" component={ResetPassword} /><Route component={StorefrontRouter} /></Switch>; }
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><CartProvider><Toaster position="top-center" /><Suspense fallback={<RouteFallback />}><Router /></Suspense></CartProvider></TooltipProvider></ThemeProvider></ErrorBoundary>; }
