/**
 * fix
 */
export function fix(number: number | null, digits: number) {
  if (number === null) {
    return null;
  }
  return Number(number.toFixed(digits));
}

/**
 * range - minimal `lodash.range`
 */
export function range(start: number, end?: number) {
  return Array.from(
    { length: end === undefined ? start : end - start },
    (_, i) => (end === undefined ? i : start + i),
  );
}

/**
 * sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
