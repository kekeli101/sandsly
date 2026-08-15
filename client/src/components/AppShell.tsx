// Style reminder: this shell carries the reference's fixed mobile header, orange active state, and bottom navigation.

import { Link, useLocation } from "wouter";
import { Home as HomeIcon, Menu as MenuIcon, QrCode, ShoppingCart, UserRound, Utensils, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

const markUrl = "/brand-mark.svg";

const navItems = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Menu", href: "/menu", icon: Utensils },
  { label: "Rewards", href: "/rewards", icon: QrCode },
  { label: "Profile", href: "/profile", icon: UserRound },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${compact ? "min-w-0" : ""}`}>
      <span className="brand-mark flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#ff5a1f] p-1.5 shadow-[3px_3px_0_#000]">
        <img src={markUrl} alt="" className="h-full w-full object-contain" />
      </span>
      <span className="font-display text-[clamp(0.86rem,3.3vw,1.1rem)] font-black uppercase leading-none tracking-[-0.04em] text-[#ff5a1f]">
        The Crunch Bite
      </span>
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { itemCount } = useCart();
  const isActive = (href: string) => href === "/" ? location === "/" : location.startsWith(href);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0b0b] text-[#f5eee9]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[248px] flex-col border-r border-[#2a2928] bg-[#111111] px-6 py-8 md:flex">
        <Brand />
        <div className="mt-14 flex flex-1 flex-col gap-2">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-[12px] px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] transition-all duration-200 ${
                isActive(href)
                  ? "translate-x-1 bg-[#ff5a1f] text-[#111111] shadow-[4px_4px_0_#000]"
                  : "text-[#9d9590] hover:bg-[#292625] hover:text-[#ff5a1f]"
              }`}
            >
              <Icon size={18} strokeWidth={2.2} />
              {label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setLocation("/menu")}
          className="rounded-[12px] border border-[#ff5a1f] bg-transparent px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#ff5a1f] transition-all hover:bg-[#ff5a1f] hover:text-[#111111] active:scale-[0.97]"
        >
          Order now
        </button>
      </aside>

      <header className="sticky top-0 z-40 flex h-[62px] items-center justify-between border-b border-[#292727] bg-[#101010]/95 px-5 backdrop-blur-xl md:hidden">
        <button type="button" aria-label="Open menu" onClick={() => toast.info("Use the bottom bar to jump around the MVP.")} className="rounded-lg p-2 text-[#d4cbc5] transition-transform active:scale-95">
          <MenuIcon size={21} />
        </button>
        <Brand compact />
        <button type="button" aria-label="Open cart" onClick={() => setLocation("/cart")} className="relative rounded-lg p-2 text-[#d4cbc5] transition-transform active:scale-95">
          <ShoppingCart size={21} />
          {itemCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff5a1f] px-1 text-[9px] font-black text-[#111111]">{itemCount}</span>}
        </button>
      </header>

      <main className="md:ml-[248px]">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#2b2928] bg-[#111111]/98 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_20px_rgba(0,0,0,0.24)] backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-[430px] items-center justify-around gap-1">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className={`flex min-w-[66px] flex-1 flex-col items-center justify-center rounded-[11px] py-2 text-[9px] font-black uppercase tracking-[0.12em] transition-all duration-200 ${
                isActive(href) ? "bg-[#ff5a1f] text-[#111111] shadow-[3px_3px_0_#000]" : "text-[#8d8580] hover:text-[#ff5a1f]"
              }`}
            >
              <Icon size={17} strokeWidth={2.3} />
              <span className="mt-1">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function BackButton({ onClick }: { onClick?: () => void }) {
  const [, setLocation] = useLocation();
  return (
    <button type="button" onClick={onClick ?? (() => setLocation("/menu"))} aria-label="Go back" className="rounded-lg p-2 text-[#d8cec9] transition-all hover:bg-[#292625] active:scale-95">
      <X className="rotate-45" size={23} />
    </button>
  );
}
