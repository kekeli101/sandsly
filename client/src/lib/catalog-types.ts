export type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  pricePesewas: number;
  imageUrl: string;
  badge: string | null;
  crunchLevel: number;
  categorySlug: string;
  categoryName: string;
  sortOrder: number;
};

export type CartLine = Pick<CatalogProduct, "id" | "name" | "description" | "pricePesewas" | "imageUrl" | "badge" | "crunchLevel"> & {
  quantity: number;
};

export const formatGhsPesewas = (pesewas: number) => `GH₵ ${(pesewas / 100).toFixed(2)}`;
