// Style reminder: cart mirrors the reference bag screen with charcoal line items and a sticky orange checkout action.

import { ArrowLeft, Minus, Plus, ReceiptText, Tag, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/menu-data";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { lines, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const deliveryFee = lines.length ? 2 : 0;
  const total = subtotal + deliveryFee;

  const checkout = () => {
    toast.success("Checkout is ready for the next MVP pass", { description: "Your order is saved in this demo session." });
    clearCart();
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-32">
      <div className="mx-auto max-w-[740px] px-5 pb-10 pt-7 sm:px-8 md:pt-12">
        <div className="flex items-center gap-3"><button type="button" onClick={() => setLocation("/menu")} aria-label="Back to menu" className="rounded-lg p-2 text-[#e2d8d1] transition-all hover:bg-[#292625] active:scale-95"><ArrowLeft size={22} /></button><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff5a1f]">The good stuff</p><h1 className="mt-1 font-display text-[2rem] font-black uppercase leading-none tracking-[-0.07em] text-[#fff7f2]">Your bag</h1></div></div>

        {lines.length === 0 ? (
          <div className="mt-16 rounded-[16px] border border-[#393432] bg-[#242424] p-8 text-center shadow-[4px_4px_0_#050505]"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#171717] text-[#ff5a1f]"><ReceiptText size={24} /></div><h2 className="mt-5 font-display text-[1.5rem] font-black uppercase tracking-[-0.04em] text-[#fff7f2]">Bag is empty</h2><p className="mx-auto mt-2 max-w-[280px] text-sm leading-6 text-[#bdb2ac]">Nothing crunchy in here yet. Let’s fix that.</p><button type="button" onClick={() => setLocation("/menu")} className="mt-6 h-11 rounded-[10px] bg-[#ff5a1f] px-5 text-xs font-black uppercase tracking-[0.14em] text-[#111111] shadow-[3px_3px_0_#050505] transition-all active:scale-[0.98]">Browse menu</button></div>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              {lines.map((line) => (
                <article key={line.id} className="flex gap-4 rounded-[15px] border border-[#48413e] bg-[#292929] p-3.5 shadow-[3px_3px_0_#050505]">
                  <img src={line.image} alt={line.name} className="h-[88px] w-[88px] shrink-0 rounded-[10px] object-cover" />
                  <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="font-display text-[1rem] font-black leading-tight text-[#fff7f2]">{line.name}</h2><button type="button" aria-label={`Remove ${line.name}`} onClick={() => removeItem(line.id)} className="shrink-0 p-1 text-[#dbc7be] transition-colors hover:text-[#ff5a1f]"><Trash2 size={16} /></button></div><p className="mt-1 font-display text-sm font-black text-[#ff5a1f]">{formatPrice(line.price)}</p><div className="mt-3 inline-flex items-center rounded-full bg-[#171717] p-1"><button type="button" aria-label="Decrease quantity" onClick={() => updateQuantity(line.id, -1)} className="flex h-6 w-6 items-center justify-center rounded-full text-[#a79b94] transition-colors hover:bg-[#2b2826] hover:text-[#ff5a1f]"><Minus size={13} /></button><span className="w-7 text-center text-xs font-black text-[#fff7f2]">{line.quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => updateQuantity(line.id, 1)} className="flex h-6 w-6 items-center justify-center rounded-full text-[#a79b94] transition-colors hover:bg-[#2b2826] hover:text-[#ff5a1f]"><Plus size={13} /></button></div></div>
                </article>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={() => toast.info("Notes are coming in the next pass.")} className="flex h-12 items-center justify-center gap-2 rounded-[10px] border border-[#3d3734] bg-[#211b19] text-[10px] font-black uppercase tracking-[0.11em] text-[#ded3cc] transition-all hover:border-[#ff5a1f] hover:text-[#ff5a1f]"><ReceiptText size={15} /> Add note</button><button type="button" onClick={() => toast.info("Promo codes are coming in the next pass.")} className="flex h-12 items-center justify-center gap-2 rounded-[10px] border border-[#3d3734] bg-[#211b19] text-[10px] font-black uppercase tracking-[0.11em] text-[#ded3cc] transition-all hover:border-[#ff5a1f] hover:text-[#ff5a1f]"><Tag size={15} /> Promo code</button></div>

            <section className="mt-8 rounded-[15px] border border-[#48413e] bg-[#242424] p-5 shadow-[3px_3px_0_#050505]"><div className="flex items-center justify-between border-b border-[#4b423e] pb-4"><h2 className="font-display text-[1.05rem] font-black uppercase tracking-[-0.03em] text-[#fff7f2]">Order summary</h2><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ff5a1f]">MVP</span></div><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between text-[#c4b9b2]"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div><div className="flex justify-between text-[#c4b9b2]"><dt>Delivery fee</dt><dd>{formatPrice(deliveryFee)}</dd></div><div className="flex justify-between border-t border-[#4b423e] pt-3 font-display text-lg font-black text-[#fff7f2]"><dt>Total</dt><dd className="text-[#ff5a1f]">{formatPrice(total)}</dd></div></dl></section>
          </>
        )}
      </div>

      {lines.length > 0 && <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#3a322f] bg-[#111111]/98 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:left-[248px]"><div className="mx-auto max-w-[740px]"><button type="button" onClick={checkout} className="flex h-14 w-full items-center justify-center gap-3 rounded-[10px] bg-[#ff5a1f] text-xs font-black uppercase tracking-[0.16em] text-[#111111] shadow-[4px_4px_0_#050505] transition-all hover:bg-[#ff6b38] active:translate-y-0.5 active:shadow-[2px_2px_0_#050505]">Checkout <ArrowLeft className="rotate-180" size={19} /></button></div></div>}
    </div>
  );
}
