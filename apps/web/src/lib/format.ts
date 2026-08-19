/** Formato de moneda consistente con el admin (S/ #,##0.00, docs/15). */
export function formatMoney(value: string | number): string {
  return `S/ ${Number(value).toFixed(2)}`;
}
