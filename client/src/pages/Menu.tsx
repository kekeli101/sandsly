// Style reminder: menu follows the reference with an orange active category pill, database-backed items, and quick add actions.

import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";
import FoodCard from "@/components/FoodCard";
import { fallbackCatalog } from "@/lib/catalog-fallback";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";

function getRequestedCategory(location: string) {
  return location.split("/")[2]?.split("?")[0] || new URLSearchParams(location.split("?")[1] ?? "").get("category") || "boba";
}

export default function Menu() {
  const [location, setLocation] = useLocation();
  const { itemCount } = useCart();
  const catalogQuery = trpc.catalog.list.useQuery(undefined, { staleTime: 30_000, gcTime: 10 * 60_000, refetchOnWindowFocus: false, retry: 1 });
  const catalog = catalogQuery.data ?? fallbackCatalog;
  const categories = catalog.categories;
  const [selected, setSelected] = useState(() => getRequestedCategory(location));
  const [search, setSearch] = useState("");
  const selectedCategory = categories.some((category) => category.slug === selected) ? selected : (categories[0]?.slug ?? "boba");
  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalog.products.filter((item) => item.categorySlug === selectedCategory && (!query || `${item.name} ${item.description} ${item.categoryName}`.toLowerCase().includes(query)));
  }, [catalog.products, search, selectedCategory]);

  useEffect(() => setSelected(getRequestedCategory(location)), [location]);
  const selectCategory = (slug: string) => { setSelected(slug); setLocation(`/menu/${slug}`); };

  return <div className="min-h-screen bg-[#0b0b0b] px-5 pb-12 pt-7 sm:px-8 md:px-12 md:pt-12"><div className="mx-auto max-w-[1100px]">
    <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff5a1f]">Pick your next bite</p><h1 className="mt-2 font-display text-[clamp(2.4rem,10vw,4rem)] font-black uppercase leading-none tracking-[-0.08em] text-[#fff7f2]">Full menu</h1><p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#958984]">Tasty Foods You Can Trust</p></div><button type="button" onClick={() => setLocation("/cart")} className="relative mb-1 hidden h-11 w-11 items-center justify-center rounded-full border border-[#48403c] text-[#f5eee9] transition-all hover:border-[#ff5a1f] hover:text-[#ff5a1f] active:scale-95 md:flex"><ShoppingCart size={18} />{itemCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff5a1f] px-1 text-[10px] font-black text-[#111111]">{itemCount}</span>}</button></div>
    <label className="mt-7 flex h-12 items-center gap-3 rounded-[10px] border border-[#48403c] bg-[#1d1c1b] px-4 text-[#a99d97] focus-within:border-[#ff5a1f]"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search meals, drinks, or desserts" className="min-w-0 flex-1 bg-transparent text-sm text-[#fff7f2] outline-none placeholder:text-[#817671]" /></label>
    <div className="mt-5 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{categories.map((category) => <button key={category.slug} type="button" onClick={() => selectCategory(category.slug)} className={`shrink-0 rounded-full border px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-200 active:scale-[0.97] ${selectedCategory === category.slug ? "border-[#ff5a1f] bg-[#ff5a1f] text-[#111111] shadow-[3px_3px_0_#000]" : "border-[#373331] bg-[#232323] text-[#b6aba5] hover:border-[#ff5a1f] hover:text-[#ff5a1f]"}`}>{category.name}</button>)}</div>
    <div className="mb-5 mt-9 flex items-baseline justify-between"><h2 className="font-display text-[1.55rem] font-black uppercase tracking-[-0.05em] text-[#fff7f2]">{categories.find((category) => category.slug === selectedCategory)?.name ?? "Menu"}</h2><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#897e78]">{visibleItems.length} items</span></div>
    {visibleItems.length ? <div className="grid gap-5 md:grid-cols-2">{visibleItems.map((item) => <FoodCard key={item.id} item={item} />)}</div> : <div className="rounded-[15px] border border-[#48403c] bg-[#242424] p-8 text-center text-sm text-[#bdb2ac]">No available items match “{search}” in this category.</div>}
  </div></div>;
}
