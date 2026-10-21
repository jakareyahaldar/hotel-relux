/**
 * Bengali (bn-BD) locale formatting helpers.
 *
 * Used everywhere a number reaches the guest: prices, night counts, room
 * counters. Dates live in `dates.js`, currency formatting in `pricing.js`.
 */
export const BN_LOCALE = 'bn-BD';

/** Format a number with Bengali digits and grouping, e.g. 9800 -> ৯,৮০০. */
export function formatNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value == null ? '' : String(value);
  return numeric.toLocaleString(BN_LOCALE);
}

/** Rewrite the Latin digits inside a string as Bengali digits. */
export function toBnDigits(value) {
  return String(value ?? '').replace(/[0-9]/g, (digit) => '০১২৩৪৫৬৭৮৯'[Number(digit)]);
}