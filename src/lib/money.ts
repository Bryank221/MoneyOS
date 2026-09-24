const DEFAULT_CURRENCY = "MYR";

/** Convert integer minor units (cents) to a major-unit number, e.g. 1850 -> 18.5 */
export function minorToMajor(minor: number): number {
  return minor / 100;
}

/** Convert a major-unit number to integer minor units, e.g. 18.5 -> 1850 */
export function majorToMinor(major: number): number {
  return Math.round(major * 100);
}

export function formatMoney(
  minor: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  const formatter = new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  });
  const formatted = formatter.format(minorToMajor(minor));
  // Normalize away the (possibly non-breaking) space Intl inserts between
  // the currency symbol and the amount, and any "MYR" fallback to "RM".
  return currency === "MYR"
    ? formatted.replace(/^(-?)(MYR|RM)\s?/, "$1RM")
    : formatted;
}

export function formatSignedMoney(
  minor: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  const sign = minor > 0 ? "+" : minor < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(minor), currency)}`;
}
