export type CatalogVisibilityRow<T> = {
  product: T;
  productIsActive: boolean;
  categoryIsActive: boolean;
};

export function isCustomerCatalogVisible(productIsActive: boolean, categoryIsActive: boolean) {
  return productIsActive && categoryIsActive;
}

export function filterCustomerCatalogProducts<T>(rows: CatalogVisibilityRow<T>[]) {
  return rows
    .filter((row) => isCustomerCatalogVisible(row.productIsActive, row.categoryIsActive))
    .map((row) => row.product);
}
