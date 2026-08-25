export function calculateRecordedProfit(input: {
  fulfilledSalesPesewas: number;
  recipeCogsPesewas: number;
  inventoryWastePesewas: number;
  operatingExpensesPesewas: number;
  uncostedMenuRevenuePesewas: number;
}) {
  const directCostPesewas = input.recipeCogsPesewas + input.inventoryWastePesewas;
  const grossProfitPesewas = input.fulfilledSalesPesewas - directCostPesewas;
  const netProfitPesewas = grossProfitPesewas - input.operatingExpensesPesewas;
  return {
    ...input,
    directCostPesewas,
    grossProfitPesewas,
    netProfitPesewas,
    grossMarginBasisPoints: input.fulfilledSalesPesewas > 0 ? Math.round(grossProfitPesewas / input.fulfilledSalesPesewas * 10_000) : 0,
    netMarginBasisPoints: input.fulfilledSalesPesewas > 0 ? Math.round(netProfitPesewas / input.fulfilledSalesPesewas * 10_000) : 0,
    isComplete: input.uncostedMenuRevenuePesewas === 0,
  };
}
