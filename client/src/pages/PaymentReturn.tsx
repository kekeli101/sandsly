import { useEffect } from "react";
import { CheckCircle2, CircleAlert, Clock3, Loader2, ReceiptText } from "lucide-react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";

export default function PaymentReturn() {
  const search = useSearch();
  const reference = new URLSearchParams(search).get("reference") ?? "";
  const utils = trpc.useUtils();
  const verification = trpc.storefront.verifyPaystackPayment.useMutation({
    onSuccess: async () => { await utils.storefront.orders.invalidate(); },
  });

  useEffect(() => {
    if (reference && !verification.isPending && !verification.data && !verification.error) verification.mutate({ reference });
  }, [reference, verification]);

  const content = !reference ? { icon: <CircleAlert size={26} />, heading: "Payment reference missing", body: "Return to your profile to review the payment status for your order.", tone: "text-[#ffb09a]" }
    : verification.isPending || (!verification.data && !verification.error) ? { icon: <Loader2 className="animate-spin" size={26} />, heading: "Checking your payment", body: "We are confirming the Paystack test transaction against your order total.", tone: "text-[#ffb09a]" }
      : verification.error ? { icon: <CircleAlert size={26} />, heading: "We couldn’t confirm that payment", body: "No order details were changed. Return to your profile and try again if Paystack shows a completed transaction.", tone: "text-[#ffb09a]" }
        : verification.data?.status === "successful" ? { icon: <CheckCircle2 size={26} />, heading: "Test payment confirmed", body: `Order ${verification.data.orderNumber} is marked paid and can now be tracked from your profile.`, tone: "text-[#9fe0b5]" }
          : verification.data?.status === "pending" ? { icon: <Clock3 size={26} />, heading: "Payment still pending", body: "Paystack has not confirmed the test payment yet. Check your profile again shortly.", tone: "text-[#ffd080]" }
            : { icon: <CircleAlert size={26} />, heading: "Payment was not completed", body: "Your order remains visible in your profile, but it has not been marked as paid.", tone: "text-[#ffb09a]" };

  return <main className="min-h-[calc(100vh-62px)] bg-[#0b0b0b] px-5 py-14 text-[#fff7f2] sm:px-8 md:min-h-screen md:py-24"><section className="mx-auto max-w-[560px] rounded-[16px] border border-[#48413e] bg-[#242424] p-6 shadow-[4px_4px_0_#050505]"><span className={`flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#171717] ${content.tone}`}>{content.icon}</span><p className="mt-8 text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5a1f]">Paystack test checkout</p><h1 className="mt-2 font-display text-[clamp(2rem,9vw,3.5rem)] font-black uppercase leading-[0.9] tracking-[-0.07em]">{content.heading}</h1><p className="mt-5 text-sm leading-7 text-[#cbbfb8]">{content.body}</p><Link href="/profile" className="mt-8 inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#ff5a1f] px-4 text-xs font-black uppercase tracking-[0.12em] text-[#18100d]"><ReceiptText size={16} /> View order history</Link></section></main>;
}
