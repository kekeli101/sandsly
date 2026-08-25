import { describe, expect, it } from "vitest";
import { filterLiveMenuItems } from "../client/src/lib/menu-filter";

const products = [
  { id: "boba", name: "Matcha Boba", description: "Tea", categorySlug: "boba", categoryName: "Boba", pricePesewas: 7500, imageUrl: "https://example.com/boba.jpg", badge: null, crunchLevel: 0, sortOrder: 1 },
  { id: "pork", name: "Crunchy Pork", description: "Crisp pork belly", categorySlug: "pork", categoryName: "Pork", pricePesewas: 12000, imageUrl: "https://example.com/pork.jpg", badge: null, crunchLevel: 4, sortOrder: 2 },
];

describe("global live-menu search", () => {
  it("finds a dish outside the previously active category when All is selected", () => {
    expect(filterLiveMenuItems(products, "all", "pork").map(item => item.id)).toEqual(["pork"]);
  });

  it("keeps category filtering explicit when a category is selected", () => {
    expect(filterLiveMenuItems(products, "boba", "pork")).toEqual([]);
  });
});
