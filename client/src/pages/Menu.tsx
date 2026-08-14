// Style reminder: menu follows the reference with an orange active category pill, stacked food cards, and quick add actions.

import { useEffect, useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";
import FoodCard from "@/components/FoodCard";
import { categoryLabels, menuItems, type MenuCategory } from "@/lib/menu-data";
import { useCart } from "@/contexts/CartContext";

const categories: Array<{ id: MenuCategory; label: string }> = [
  { id: "savory", label: "Savory" },
  { id: "boba", label: "Boba & sweets" },
  { id: "sides", label: "Sides" },
];

function getCategory(location: string): MenuCategory {
  const category = new URLSearchParams(location.split("?")[1] ?? "").get("category");
  return category === "boba" || category === "sides" ? category : "savory";
}

export default function Menu() {
  const [location, setLocation] = useLocation();
  const { itemCount } = useCart();
  const [selected, setSelected] = useState<MenuCategory>(() => getCategory(location));

  useEffect(() => setSelected(getCategory(location)), [location]);

  const visibleItems = useMemo(() => menuItems.filter((item) => item.category === selected), [selected]);

  const selectCategory = (category: MenuCategory) => {
    setSelected(category);
    setLocation(`/menu?category=${category}`);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] px-5 pb-12 pt-7 sm:px-8 md:px-12 md:pt-12">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff5a1f]">Pick your next bite</p><h1 className="mt-2 font-display text-[clamp(2.4rem,10vw,4rem)] font-black uppercase leading-none tracking-[-0.08em] text-[#fff7f2]">Full menu</h1></div>
          <button type="button" onClick={() => setLocation("/cart")} className="relative mb-1 hidden h-11 w-11 items-center justify-center rounded-full border border-[#48403c] text-[#f5eee9] transition-all hover:border-[#ff5a1f] hover:text-[#ff5a1f] active:scale-95 md:flex"><ShoppingCart size={18} />{itemCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff5a1f] px-1 text-[10px] font-black text-[#111111]">{itemCount}</span>}</button>
        </div>

        <div className="mt-8 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => <button key={category.id} type="button" onClick={() => selectCategory(category.id)} className={`shrink-0 rounded-full border px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-200 active:scale-[0.97] ${selected === category.id ? "border-[#ff5a1f] bg-[#ff5a1f] text-[#111111] shadow-[3px_3px_0_#000]" : "border-[#373331] bg-[#232323] text-[#b6aba5] hover:border-[#ff5a1f] hover:text-[#ff5a1f]"}`}>{category.label}</button>)}
        </div>

        <div className="mb-5 mt-9 flex items-baseline justify-between"><h2 className="font-display text-[1.55rem] font-black uppercase tracking-[-0.05em] text-[#fff7f2]">{categoryLabels[selected]}</h2><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#897e78]">{visibleItems.length} items</span></div>
        <div className="grid gap-5 md:grid-cols-2">
          {visibleItems.map((item) => <FoodCard key={item.id} item={item} />)}
        </div>
      </div>
    </div>
  );
}
