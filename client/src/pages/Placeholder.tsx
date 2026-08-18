// Style reminder: MVP placeholder states stay honest, dark, and action-oriented instead of presenting fake customer data.

import { ArrowRight, QrCode, UserRound } from "lucide-react";
import { useLocation } from "wouter";

export default function Placeholder({ kind }: { kind: "rewards" | "profile" }) {
  const [, setLocation] = useLocation();
  const rewards = kind === "rewards";
  const Icon = rewards ? QrCode : UserRound;
  return <div className="min-h-[calc(100vh-62px)] bg-[#0b0b0b] px-5 py-14 sm:px-8 md:min-h-screen md:px-12 md:py-24"><div className="mx-auto max-w-[620px]"><span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#ff5a1f] text-[#111111] shadow-[4px_4px_0_#000]"><Icon size={25} /></span><p className="mt-10 text-[10px] font-black uppercase tracking-[0.18em] text-[#ff5a1f]">Coming soon</p><h1 className="mt-2 font-display text-[clamp(2.6rem,12vw,5rem)] font-black uppercase leading-[0.86] tracking-[-0.08em] text-[#fff7f2]">{rewards ? "Rewards are coming." : "Your profile is next."}</h1><p className="mt-6 max-w-[430px] text-[0.98rem] leading-7 text-[#bdb2ac]">{rewards ? "We’re designing a proper Crunch Bite rewards programme with points, perks, and QR redemption. It is not available yet, but this page will be where members track their benefits." : "Account sign-in and saved favorites are scoped for the next MVP pass. You can still browse and build a bag right now."}</p><button type="button" onClick={() => setLocation("/menu")} className="mt-8 inline-flex h-12 items-center gap-3 rounded-[10px] bg-[#ff5a1f] px-5 text-xs font-black uppercase tracking-[0.16em] text-[#111111] shadow-[4px_4px_0_#000] transition-all active:translate-y-0.5">Order a bite <ArrowRight size={17} /></button></div></div>;
}
