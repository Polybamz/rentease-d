/**
 * Money formatting for RentEase.
 *
 * Every amount in the app is Central African CFA francs (XAF). XAF has no
 * minor unit, so amounts are always whole francs — never format them with
 * decimals.
 */

export const CURRENCY_CODE = "XAF";
/** How the currency is written on labels and in prose. */
export const CURRENCY_LABEL = "FCFA";

const xaf = new Intl.NumberFormat("fr-CM", {
  style: "currency",
  currency: CURRENCY_CODE,
  maximumFractionDigits: 0,
});

/** `312000` → `"312 000 FCFA"`. */
export function formatXaf(amount: number): string {
  return xaf.format(Math.round(amount) || 0);
}

/** Short form for tight spots (map pins, slider ends): `312000` → `"312k FCFA"`. */
export function formatXafCompact(amount: number): string {
  const n = Math.round(amount) || 0;
  if (Math.abs(n) < 1000) return `${n} ${CURRENCY_LABEL}`;
  const k = n / 1000;
  return `${Number.isInteger(k) ? k : k.toFixed(1)}k ${CURRENCY_LABEL}`;
}
