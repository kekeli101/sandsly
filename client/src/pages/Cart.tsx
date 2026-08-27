import { ArrowLeft, Bike, CreditCard, Minus, PackageCheck, Plus, ReceiptText, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { formatGhsPesewas } from "@/lib/catalog-types";
import { trpc } from "@/lib/trpc";

const deliveryFeePesewas = 2000;
type OrderType = "pickup" | "delivery";
type PaymentMethod = "cash_on_pickup" | "cash_on_delivery" | "mobile_money" | "card";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { lines, subtotalPesewas, updateQuantity, removeItem, isLoading, isAuthenticated } = useCart();
  const utils = trpc.useUtils();
  const profileQuery = trpc.storefront.profile.useQuery(undefined, { enabled: isAuthenticated, retry: false, staleTime: 5 * 60_000 });
  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_pickup");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [note, setNote] = useState("");
  const deliveryFee = orderType === "delivery" ? deliveryFeePesewas : 0;
  const total = subtotalPesewas + deliveryFee;
  const isOnlinePayment = paymentMethod === "mobile_money" || paymentMethod === "card";
  const checkoutMutation = trpc.storefront.checkout.useMutation({
    onSuccess: order => {
      utils.storefront.cart.setData(undefined, { items: [], subtotalPesewas: 0, deliveryFeePesewas: 0, totalPesewas: 0 });
      void utils.storefront.cart.invalidate();
      void utils.storefront.orders.invalidate();
      if ("paymentAuthorizationUrl" in order && order.paymentAuthorizationUrl) {
        toast.success("Opening secure Paystack test checkout", { description: "No real payment will be collected." });
        window.location.assign(order.paymentAuthorizationUrl);
        return;
      }
      if ("onlinePaymentPending" in order && order.onlinePaymentPending) {
        toast.error("Your order is saved, but secure checkout did not open", { description: "Open your profile and use the Paystack retry action when you are ready." });
        setLocation("/profile");
        return;
      }
      toast.success(`Order ${order.orderNumber} is in`, { description: "Track preparation and fulfillment in your profile." });
      setLocation("/profile");
    },
    onError: error => toast.error("Checkout could not start", { description: error.message }),
  });

  const switchOrderType = (next: OrderType) => {
    setOrderType(next);
    setPaymentMethod(next === "delivery" ? "cash_on_delivery" : "cash_on_pickup");
    if (next === "delivery") {
      setPhone(profileQuery.data?.phone ?? "");
      setAddress(profileQuery.data?.defaultAddress ?? "");
    }
  };
  const submit = () => {
    if (orderType === "delivery" && (!phone.trim() || !address.trim())) {
      toast.error("Add a phone number and delivery address");
      return;
    }
    checkoutMutation.mutate({
      orderType,
      paymentMethod,
      customerNote: note.trim() || undefined,
      deliveryPhone: phone.trim() || undefined,
      deliveryAddress: address.trim() || undefined,
      deliveryInstructions: instructions.trim() || undefined,
    });
  };

  return <div className="min-h-screen bg-[#0b0b0b] pb-32">
    <div className="mx-auto max-w-[760px] px-5 pb-10 pt-7 sm:px-8 md:pt-12">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setLocation("/menu")} aria-label="Back to menu" className="rounded-lg p-2 text-[#e2d8d1] hover:bg-[#292625]"><ArrowLeft size={22} /></button>
        <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff5a1f]">Checkout</p><h1 className="mt-1 font-display text-[2rem] font-black uppercase leading-none tracking-[-0.07em] text-[#fff7f2]">Your bag</h1></div>
      </div>
      {isLoading ? <div className="mt-12 h-52 animate-pulse rounded-[16px] bg-[#242424]" /> : lines.length === 0 ? <EmptyBag onBrowse={() => setLocation("/menu")} /> : <>
        <div className="mt-8 space-y-4">{lines.map(line => <article key={line.id} className="flex gap-4 rounded-[15px] border border-[#48413e] bg-[#292929] p-3.5 shadow-[3px_3px_0_#050505]">
          <img src={line.imageUrl} alt={line.name} className="h-[88px] w-[88px] shrink-0 rounded-[10px] object-cover" loading="lazy" decoding="async" />
          <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="font-display text-[1rem] font-black leading-tight text-[#fff7f2]">{line.name}</h2><button type="button" aria-label={`Remove ${line.name}`} onClick={() => removeItem(line.id)} className="shrink-0 p-1 text-[#dbc7be] hover:text-[#ff5a1f]"><Trash2 size={16} /></button></div>
            <p className="mt-1 font-display text-sm font-black text-[#ff5a1f]">{formatGhsPesewas(line.pricePesewas)}</p>
            <div className="mt-3 inline-flex items-center rounded-full bg-[#171717] p-1"><button type="button" aria-label="Decrease quantity" onClick={() => updateQuantity(line.id, -1)} className="flex h-6 w-6 items-center justify-center rounded-full text-[#a79b94] hover:bg-[#2b2826] hover:text-[#ff5a1f]"><Minus size={13} /></button><span className="w-7 text-center text-xs font-black text-[#fff7f2]">{line.quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => updateQuantity(line.id, 1)} className="flex h-6 w-6 items-center justify-center rounded-full text-[#a79b94] hover:bg-[#2b2826] hover:text-[#ff5a1f]"><Plus size={13} /></button></div>
          </div>
        </article>)}</div>
        <section className="mt-6 rounded-[15px] border border-[#48413e] bg-[#242424] p-5 shadow-[3px_3px_0_#050505]">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ff5a1f]">How should we fulfill it?</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"><Choice selected={orderType === "pickup"} onClick={() => switchOrderType("pickup")} icon={<PackageCheck size={18} />} label="Pickup" detail="Collect at the restaurant" /><Choice selected={orderType === "delivery"} onClick={() => switchOrderType("delivery")} icon={<Bike size={18} />} label="Delivery" detail="GH₵ 20.00 delivery fee" /></div>
          {orderType === "delivery" && <div className="mt-4 grid gap-3"><Field label="Delivery phone"><input value={phone} onChange={event => setPhone(event.target.value)} placeholder="e.g. 024 000 0000" /></Field><Field label="Delivery address"><textarea value={address} onChange={event => setAddress(event.target.value)} rows={3} placeholder="House number, street, area, landmark" /></Field><Field label="Driver instructions (optional)"><input value={instructions} onChange={event => setInstructions(event.target.value)} placeholder="Gate, landmark, or drop-off note" /></Field></div>}
        </section>
        <section className="mt-5 rounded-[15px] border border-[#48413e] bg-[#242424] p-5 shadow-[3px_3px_0_#050505]">
          <div className="flex items-center gap-2"><CreditCard size={17} className="text-[#ff5a1f]" /><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ff5a1f]">Payment method</p></div>
          <select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value as PaymentMethod)} className="mt-3 h-11 w-full rounded-[9px] border border-[#4a403c] bg-[#171717] px-3 text-sm text-[#fff7f2] outline-none focus:border-[#ff5a1f]">
            <option value={orderType === "delivery" ? "cash_on_delivery" : "cash_on_pickup"}>{orderType === "delivery" ? "Cash on delivery" : "Cash on pickup"}</option>
            <option value="mobile_money">Mobile Money — Paystack test checkout</option><option value="card">Card — Paystack test checkout</option>
          </select>
          <p className="mt-2 text-xs leading-5 text-[#bdb2ac]">{isOnlinePayment ? "You will be redirected to Paystack’s secure test checkout. No real payment will be collected." : "Pay at collection or delivery."}</p>
        </section>
        <section className="mt-5 rounded-[15px] border border-[#48413e] bg-[#242424] p-5 shadow-[3px_3px_0_#050505]"><Field label="Kitchen note (optional)"><textarea value={note} onChange={event => setNote(event.target.value)} maxLength={280} rows={3} placeholder="Allergies, preferences, or pickup notes" /></Field></section>
        <section className="mt-5 rounded-[15px] border border-[#48413e] bg-[#242424] p-5 shadow-[3px_3px_0_#050505]"><div className="flex items-center justify-between border-b border-[#4b423e] pb-4"><h2 className="font-display text-[1.05rem] font-black uppercase tracking-[-0.03em] text-[#fff7f2]">Order summary</h2><span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ff5a1f]">GHS</span></div><dl className="mt-4 space-y-3 text-sm"><Row label="Subtotal" value={formatGhsPesewas(subtotalPesewas)} /><Row label="Delivery fee" value={formatGhsPesewas(deliveryFee)} /><div className="flex justify-between border-t border-[#4b423e] pt-3 font-display text-lg font-black text-[#fff7f2]"><dt>Total</dt><dd className="text-[#ff5a1f]">{formatGhsPesewas(total)}</dd></div></dl></section>
      </>}
    </div>
    {lines.length > 0 && <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#3a322f] bg-[#111111]/98 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:left-[248px]"><div className="mx-auto max-w-[760px]"><button type="button" disabled={checkoutMutation.isPending} onClick={submit} className="flex h-14 w-full items-center justify-center gap-3 rounded-[10px] bg-[#ff5a1f] text-xs font-black uppercase tracking-[0.16em] text-[#111111] shadow-[4px_4px_0_#050505] disabled:opacity-60">{checkoutMutation.isPending ? "Starting secure checkout…" : isOnlinePayment ? "Continue to Paystack test checkout" : `Place ${orderType} order`}<ArrowLeft className="rotate-180" size={19} /></button></div></div>}
  </div>;
}

function Choice({ selected, onClick, icon, label, detail }: { selected: boolean; onClick: () => void; icon: React.ReactNode; label: string; detail: string }) { return <button type="button" onClick={onClick} className={`rounded-[10px] border p-3 text-left transition-colors ${selected ? "border-[#ff5a1f] bg-[#ff5a1f]/10" : "border-[#4a403c] bg-[#171717]"}`}><span className="flex items-center gap-2 text-[#ff5a1f]">{icon}<b className="text-xs uppercase tracking-[0.12em]">{label}</b></span><span className="mt-1 block text-xs text-[#bdb2ac]">{detail}</span></button>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-[10px] font-black uppercase tracking-[0.13em] text-[#bdb2ac]">{label}<span className="mt-2 block [&_input]:h-11 [&_input]:w-full [&_input]:rounded-[9px] [&_input]:border [&_input]:border-[#4a403c] [&_input]:bg-[#171717] [&_input]:px-3 [&_input]:text-base sm:[&_input]:text-sm [&_input]:font-normal [&_input]:normal-case [&_input]:tracking-normal [&_input]:text-[#fff7f2] [&_textarea]:w-full [&_textarea]:rounded-[9px] [&_textarea]:border [&_textarea]:border-[#4a403c] [&_textarea]:bg-[#171717] [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-base sm:[&_textarea]:text-sm [&_textarea]:font-normal [&_textarea]:normal-case [&_textarea]:tracking-normal [&_textarea]:text-[#fff7f2]">{children}</span></label>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between text-[#c4b9b2]"><dt>{label}</dt><dd>{value}</dd></div>; }
function EmptyBag({ onBrowse }: { onBrowse: () => void }) { return <div className="mt-16 rounded-[16px] border border-[#393432] bg-[#242424] p-8 text-center shadow-[4px_4px_0_#050505]"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#171717] text-[#ff5a1f]"><ReceiptText size={24} /></div><h2 className="mt-5 font-display text-[1.5rem] font-black uppercase tracking-[-0.04em] text-[#fff7f2]">Bag is empty</h2><p className="mx-auto mt-2 max-w-[280px] text-sm leading-6 text-[#bdb2ac]">Add a bite to choose pickup or delivery.</p><button type="button" onClick={onBrowse} className="mt-6 h-11 rounded-[10px] bg-[#ff5a1f] px-5 text-xs font-black uppercase tracking-[0.14em] text-[#111111]">Browse menu</button></div>; }
