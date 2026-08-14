// Style reminder: preserve the reference's dark restaurant shell across every route and keep the MVP routes shallow.

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import AppShell from "./components/AppShell";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Cart from "./pages/Cart";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import NotFound from "./pages/NotFound";
import Placeholder from "./pages/Placeholder";

function Rewards() { return <Placeholder kind="rewards" />; }
function Profile() { return <Placeholder kind="profile" />; }

function Router() {
  return <AppShell><Switch><Route path="/" component={Home} /><Route path="/menu" component={Menu} /><Route path="/cart" component={Cart} /><Route path="/rewards" component={Rewards} /><Route path="/profile" component={Profile} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></AppShell>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><CartProvider><Toaster position="top-center" /><Router /></CartProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
