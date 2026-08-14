export type PricedLine = { unitPricePesewas: number; quantity: number };

export function calculateOrderTotals(lines: PricedLine[], deliveryFeePesewas: number) {
  const subtotalPesewas = lines.reduce((total, line) => total + line.unitPricePesewas * line.quantity, 0);
  return {
    subtotalPesewas,
    deliveryFeePesewas,
    totalPesewas: subtotalPesewas + deliveryFeePesewas,
  };
}
