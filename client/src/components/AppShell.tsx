// Style reminder: the storefront uses a desktop sidebar and a mobile three-line navigation drawer.

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu as MenuIcon, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { getPrimaryOrderAction, isStorefrontRouteActive, storefrontNavigationItems } from "@/lib/storefront-navigation";
import { preloadRoute } from "@/lib/route-preload";

const markUrl = "/brand-mark.svg";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${compact ? "min-w-0" : ""}`}>
      <span className="brand-mark flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#ff5a1f] p-1.5 shadow-[3px_3px_0_#000]">
        <img src={markUrl} alt="" className="h-full w-full object-contain" />
      </span>
      <span className="font-display text-[clamp(0.86rem,3.3vw,1.1rem)] font-black uppercase leading-none tracking-[-0.04em] text-[#ff5a1f]">The Crunch Bite</span>
    </Link>
  );
}

function NavigationItems({ active, onNavigate }: { active: (href: string) => boolean; onNavigate?: (href: string) => void }) {
  return (
    <>
      {storefrontNavigationItems.map(({ label, href, icon: Icon }) => {
        const className = `flex w-full items-center gap-3 rounded-[12px] px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] transition-all duration-200 ${
          active(href) ? "translate-x-1 bg-[#ff5a1f] text-[#111111] shadow-[4px_4px_0_#000]" : "text-[#9d9590] hover:bg-[#292625] hover:text-[#ff5a1f]"
        }`;
        if (onNavigate) {
          return <button key={label} type="button" onPointerEnter={() => { void preloadRoute(href); }} onFocus={() => { void preloadRoute(href); }} onClick={() => onNavigate(href)} className={className}><Icon size={18} strokeWidth={2.2} />{label}</button>;
        }
        return <Link key={label} href={href} onPointerEnter={() => { void preloadRoute(href); }} onFocus={() => { void preloadRoute(href); }} className={className}><Icon size={18} strokeWidth={2.2} />{label}</Link>;
      })}
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount } = useCart();
  const isActive = (href: string) => isStorefrontRouteActive(location, href);
  const navigate = (path: string) => { void preloadRoute(path); setLocation(path); };
  const { destination: orderDestination, label: orderLabel } = getPrimaryOrderAction(itemCount);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0b0b] text-[#f5eee9]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[248px] flex-col border-r border-[#2a2928] bg-[#111111] px-6 py-8 md:flex">
        <Brand />
        <nav aria-label="Primary navigation" className="mt-14 flex flex-1 flex-col gap-2">
          <NavigationItems active={isActive} />
        </nav>
        <button type="button" onPointerEnter={() => { void preloadRoute(orderDestination); }} onFocus={() => { void preloadRoute(orderDestination); }} onClick={() => navigate(orderDestination)} className="rounded-[12px] border border-[#ff5a1f] bg-transparent px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#ff5a1f] transition-all hover:bg-[#ff5a1f] hover:text-[#111111] active:scale-[0.97]">{orderLabel}</button>
      </aside>

      <header className="sticky top-0 z-40 flex h-[62px] items-center justify-between border-b border-[#292727] bg-[#101010]/95 px-5 backdrop-blur-xl md:hidden">
        <button type="button" aria-label="Open menu" aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" onClick={() => setMobileMenuOpen(true)} className="rounded-lg p-2 text-[#d4cbc5] transition-transform active:scale-95">
          <MenuIcon size={21} />
        </button>
        <Brand compact />
        <button type="button" aria-label="Open cart" onPointerEnter={() => { void preloadRoute("/cart"); }} onFocus={() => { void preloadRoute("/cart"); }} onClick={() => navigate("/cart")} className="relative rounded-lg p-2 text-[#d4cbc5] transition-transform active:scale-95">
          <ShoppingCart size={21} />
          {itemCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff5a1f] px-1 text-[9px] font-black text-[#111111]">{itemCount}</span>}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <aside id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Primary navigation" className="relative flex h-full w-[min(82vw,320px)] flex-col border-r border-[#36312e] bg-[#111111] px-6 py-7 shadow-[12px_0_36px_rgba(0,0,0,0.38)]">
            <div className="flex items-center justify-between gap-4">
              <Brand compact />
              <button type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-2 text-[#d4cbc5] hover:bg-[#292625] hover:text-[#ff5a1f] active:scale-95"><X size={21} /></button>
            </div>
            <nav className="mt-12 flex flex-1 flex-col gap-2">
              <NavigationItems active={isActive} onNavigate={(href) => { setMobileMenuOpen(false); navigate(href); }} />
            </nav>
            <button type="button" onPointerEnter={() => { void preloadRoute(orderDestination); }} onFocus={() => { void preloadRoute(orderDestination); }} onClick={() => { setMobileMenuOpen(false); navigate(orderDestination); }} className="rounded-[12px] border border-[#ff5a1f] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#ff5a1f] transition-all hover:bg-[#ff5a1f] hover:text-[#111111] active:scale-[0.97]">{orderLabel}</button>
          </aside>
        </div>
      )}

      <main className="md:ml-[248px]">{children}</main>
    </div>
  );
}

export function BackButton({ onClick }: { onClick?: () => void }) {
  const [, setLocation] = useLocation();
  return <button type="button" onClick={onClick ?? (() => setLocation("/menu"))} aria-label="Go back" className="rounded-lg p-2 text-[#d8cec9] transition-all hover:bg-[#292625] active:scale-95"><X className="rotate-45" size={23} /></button>;
}
