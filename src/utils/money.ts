export function formatMoney(amount: string, currency: string, locale = "en"): string {
  if (!/^-?\d+(\.\d+)?$/.test(amount)) throw new Error("Money must be provided as a decimal string.");
  return new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "code" }).format(Number(amount));
}
