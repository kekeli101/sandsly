import type { CatalogProduct } from "./catalog-types";

export function filterLiveMenuItems(products: CatalogProduct[], selectedCategory: string, search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  return products.filter(item => (selectedCategory === "all" || item.categorySlug === selectedCategory) && (!normalizedSearch || `${item.name} ${item.description} ${item.categoryName}`.toLowerCase().includes(normalizedSearch)));
}
