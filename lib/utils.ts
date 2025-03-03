import * as log from "./log";

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
  log.debug("[sleep]");
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * timeout - like sleep except returns the passed-in value when finished
 */
export function timeout<T>(ms: number, result: T): Promise<T> {
  return new Promise((resolve) => setTimeout(resolve, ms, result));
}

/**
 * retry
 */
type TRetryOptions = {
  delay?: number; // milliseconds
  retries?: number;
};

export function retry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  { retries = 2, delay = 1000 }: TRetryOptions = {},
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async function (...args: Parameters<T>): Promise<ReturnType<T>> {
    let attempt = 1;
    while (true) {
      try {
        return (await fn(...args)) as ReturnType<T>;
      } catch (error) {
        if (attempt >= retries + 1) {
          throw error;
        }
        log.warn(
          `Attempt ${attempt} of ${retries + 1} failed. Retrying in ${delay}ms...`,
        );
        attempt++;
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  };
}
