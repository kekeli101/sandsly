// Style reminder: home is a dark editorial landing page with an image-led hero, orange CTA, and bento-like quick hits.

import { ArrowRight, ChevronRight, Flame, Zap } from "lucide-react";
import { useLocation } from "wouter";
import FoodCard from "@/components/FoodCard";
import { menuItems } from "@/lib/menu-data";

const quickHits = [
  { label: "Boba", category: "boba", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAToXdghCpHEt6Iqomv0rjpXB_iBHWVSReD5ScUnPNZPRo3xV2ftA6AraKr5btDpTAIKLgfGBBHpZGs0dUAZ02eAOmhPYZ-nzERM8QEi7NWGoLl5Db1aKln_PNAmYo8kupJFr4N7o3kcMFAUSZirL3YSBCSZzkITC4N1qBRWTjiIRdhaKTz1Xm5ZRul-lf8TuETwfFI6JCLu0x9Ccu3_u5lymZHjXhYaAmI16vU4EErLYqWCZ3gJny2" },
  { label: "Yogurt", category: "yogurt", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=85" },
  { label: "Ice cream", category: "ice-cream", image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=900&q=85" },
  { label: "Pizza", category: "pizza", image: "/manus-storage/crunch-bite-hero_ea29a631.jpg" },
  { label: "Fries", category: "fries", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuANuiJDnbEmyRfw8ekdDqH-09TMD3-LeUQhdCF-RFW2aMnz-SJjirSfmLW0FsIfc9QAFDxU8hL83ofsS03ZUrkHIM3GWCcAuMSgUnHI1KX3QSNsm3Pt8uhdd504ZKzjZLnesVPOdkQjLPHwimhXzTsJYW9kDpWd5HFngST_jPWqAnTvmBib7czDA1ARL1WdUoKdhnZ8rCPg74ukvwPiXu62KjR8CslW6Qq8mqW3rNHmQEm1pgRte85i" },
  { label: "Pork", category: "pork", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_72Dmatc8j1YIhJh-UIrX3bRp8O7J94Jig4st1SSYVNQXZk09vOgOVnBpz0Jk1QIv3gBw6rJnJv4Voe6iYuG7mNFCFUqKYhL0_7jhy54KS8Ww7sSOEFkDZdIOqJRHyiSAnGEQJuokxbRZN5U1L5AsLoZ-BaxAIVFig85vPGbdoDHz29S3sWSRPPD4WktksuEJJ181RxGTxlaZFlAKxKN5IDBPAbJNqIwGCjMOH5fZ6dxT3EjF7R9d" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const trending = menuItems.filter((item) => ["spicy-honey-pepperoni", "matcha-cloud-boba", "garlic-pork-bites"].includes(item.id));

  return (
    <div className="pb-8">
      <section className="relative isolate min-h-[510px] overflow-hidden border-b border-[#2c2927] sm:min-h-[590px] md:min-h-[650px]">
        <img src="/manus-storage/crunch-bite-hero_ea29a631.jpg" alt="Spicy honey pepperoni pizza with stretchy cheese" className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.72]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,11,0.1)_16%,rgba(11,11,11,0.15)_36%,#0b0b0b_100%)]" />
        <div className="relative flex min-h-[510px] flex-col justify-end px-5 pb-10 sm:min-h-[590px] sm:px-8 md:min-h-[650px] md:px-12 md:pb-16">
          <div className="max-w-[560px] animate-[rise-in_0.6s_cubic-bezier(0.23,1,0.32,1)_both]">
            <span className="inline-flex rounded-full bg-[#ff5a1f] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.17em] text-[#15100e] shadow-[3px_3px_0_#000]">New drop</span>
            <h1 className="mt-4 font-display text-[clamp(3.25rem,15vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.08em] text-[#fff7f2]">Stay <span className="text-[#ff5a1f]">crunchy.</span></h1>
            <p className="mt-5 max-w-[440px] text-[0.94rem] leading-[1.45] text-[#d2c8c2] sm:text-[1.05rem]">Gourmet street food that hits different. Big flavor, crackly edges, zero chill.</p>
            <button type="button" onClick={() => setLocation("/menu")} className="mt-7 inline-flex h-12 items-center gap-3 rounded-[10px] bg-[#ff5a1f] px-5 text-xs font-black uppercase tracking-[0.16em] text-[#17100d] shadow-[4px_4px_0_#080808] transition-all hover:translate-y-0.5 hover:bg-[#ff6b38] active:translate-y-1 active:shadow-[2px_2px_0_#080808]">Get it now <ArrowRight size={17} /></button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 md:px-12 md:py-14">
        <section>
          <div className="mb-5 flex items-center gap-2"><Zap size={16} className="text-[#ff5a1f]" fill="currentColor" /><h2 className="font-display text-[1.1rem] font-black uppercase tracking-[-0.03em] text-[#fff7f2]">Quick hits</h2></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {quickHits.map((hit) => (
              <button key={hit.label} type="button" onClick={() => setLocation(`/menu/${hit.category}`)} className="group relative aspect-square overflow-hidden rounded-[13px] border border-[#3b3633] bg-[#292929] text-left shadow-[3px_3px_0_#060606] transition-transform duration-200 hover:-translate-y-1 active:scale-[0.98]">
                <img src={hit.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-65 mix-blend-luminosity transition-opacity duration-200 group-hover:opacity-80" />
                <span className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/80" />
                <span className="absolute bottom-3 left-3 font-display text-[0.95rem] font-black uppercase tracking-[-0.03em] text-[#fff7f2]">{hit.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between"><div className="flex items-center gap-2"><Flame size={16} className="text-[#ff5a1f]" fill="currentColor" /><h2 className="font-display text-[1.1rem] font-black uppercase tracking-[-0.03em] text-[#fff7f2]">Trending now</h2></div><button type="button" onClick={() => setLocation("/menu")} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#ff5a1f]">View all <ChevronRight size={14} /></button></div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {trending.map((item) => <FoodCard key={item.id} item={item} compact />)}
          </div>
        </section>
      </div>
    </div>
  );
}
