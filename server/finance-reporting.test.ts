import { describe, expect, it } from "vitest";
import { calculateRecordedProfit } from "./finance-utils";

describe("financial tracking calculation boundaries", () => {
  it("uses only immutable recipe-cost snapshots for COGS and flags missing recipe coverage", () => {
    const report = calculateRecordedProfit({ fulfilledSalesPesewas: 126_500, recipeCogsPesewas: 21_000, inventoryWastePesewas: 1_500, operatingExpensesPesewas: 12_000, uncostedMenuRevenuePesewas: 43_500 });

    expect(report.directCostPesewas).toBe(22_500);
    expect(report.grossProfitPesewas).toBe(104_000);
    expect(report.netProfitPesewas).toBe(92_000);
    expect(report.isComplete).toBe(false);
  });

  it("keeps supplier stock purchases outside operating expenses to avoid double-counting COGS", () => {
    const report = calculateRecordedProfit({ fulfilledSalesPesewas: 100_000, recipeCogsPesewas: 25_000, inventoryWastePesewas: 4_000, operatingExpensesPesewas: 12_000, uncostedMenuRevenuePesewas: 0 });

    expect(report.directCostPesewas).toBe(29_000);
    expect(report.netProfitPesewas).toBe(59_000);
    expect(report.isComplete).toBe(true);
  });
});
