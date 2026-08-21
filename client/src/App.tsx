// Style reminder: preserve the reference's dark restaurant shell across every route and keep public storefront routes shallow.

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import AppShell from "./components/AppShell";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";

const Account = lazy(() => import("./pages/Account"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Cart = lazy(() => import("./pages/Cart"));
const Home = lazy(() => import("./pages/Home"));
const KitchenDashboard = lazy(() => import("./pages/KitchenDashboard"));
const Menu = lazy(() => import("./pages/Menu"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Placeholder = lazy(() => import("./pages/Placeholder"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

function Rewards() { return <Placeholder kind="rewards" />; }
function RouteFallback() { return <div className="min-h-screen bg-[#0b0b0b]" aria-label="Loading page" />; }
function StorefrontRouter() { return <AppShell><Switch><Route path="/" component={Home} /><Route path="/menu" component={Menu} /><Route path="/menu/:category" component={Menu} /><Route path="/cart" component={Cart} /><Route path="/rewards" component={Rewards} /><Route path="/profile" component={Account} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></AppShell>; }
function Router() { return <Switch><Route path="/admin" component={AdminDashboard} /><Route path="/kitchen" component={KitchenDashboard} /><Route path="/reset-password" component={ResetPassword} /><Route component={StorefrontRouter} /></Switch>; }
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><CartProvider><Toaster position="top-center" /><Suspense fallback={<RouteFallback />}><Router /></Suspense></CartProvider></TooltipProvider></ThemeProvider></ErrorBoundary>; }
