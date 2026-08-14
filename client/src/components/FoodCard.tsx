// Style reminder: food cards use dramatic photography, charcoal bodies, orange pricing, and compact street-food labels.

import { Plus } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog-types";
import { formatGhsPesewas } from "@/lib/catalog-types";
import { useCart } from "@/contexts/CartContext";

export default function FoodCard({ item, compact = false }: { item: CatalogProduct; compact?: boolean }) {
  const { addItem } = useCart();
  return (
    <article className={`group overflow-hidden rounded-[15px] border border-[#3a3634] bg-[#292929] shadow-[4px_4px_0_#080808] transition-transform duration-200 hover:-translate-y-1 ${compact ? "flex h-full flex-col" : ""}`}>
      <div className={`relative overflow-hidden ${compact ? "h-[170px] sm:h-[210px]" : "h-[190px]"}`}>
        {item.badge && <span className="absolute left-3 top-3 z-10 rounded-full bg-[#ff5a1f] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#17100d]">{item.badge}</span>}
        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
      </div>
      <div className={`flex flex-1 flex-col p-4 ${compact ? "sm:p-5" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[1.2rem] font-black leading-[1.05] tracking-[-0.035em] text-[#fff7f2]">{item.name}</h3>
          <span className="shrink-0 font-display text-[1.08rem] font-black text-[#ff5a1f]">{formatGhsPesewas(item.pricePesewas)}</span>
        </div>
        <p className="mt-3 text-[0.82rem] leading-[1.45] text-[#c5bcb6]">{item.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#46413e] pt-4">
          <div className="flex items-center gap-2"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#c5bcb6]">Crunch level</span><span className="flex gap-1" aria-label={`${item.crunchLevel} out of 5 crunch level`}>{[1, 2, 3, 4, 5].map((level) => <span key={level} className={`h-2 w-2 rounded-full ${level <= item.crunchLevel ? "bg-[#ff5a1f]" : "bg-[#554b46]"}`} />)}</span></div>
          <button type="button" aria-label={`Add ${item.name} to cart`} onClick={() => addItem(item)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#ff5a1f] bg-[#111111] text-[#ff5a1f] transition-all hover:bg-[#ff5a1f] hover:text-[#111111] active:scale-95"><Plus size={18} strokeWidth={2.7} /></button>
        </div>
        {!compact && <button type="button" onClick={() => addItem(item)} className="mt-4 flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#ff5a1f] text-xs font-black uppercase tracking-[0.14em] text-[#17100d] transition-all hover:bg-[#ff6c37] active:scale-[0.98]"><Plus size={16} /> Add to bag</button>}
      </div>
    </article>
  );
}
