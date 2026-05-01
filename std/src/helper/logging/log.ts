/**
 * Logs the given arguments to the console.
 *
 * @param args The arguments to log.
 */
export function log(...args: unknown[]): void {
  sim.log(...args);
}

/**
 * Logs the given arguments to the console with an info layer.
 *
 * @param args The arguments to log.
 */
export function info(...args: unknown[]): void {
  sim.log("[info]", ...args);
}

/**
 * Logs the given arguments to the console with a debug layer.
 *
 * @param args The arguments to log.
 */
export function debug(...args: unknown[]): void {
  sim.log("[debug]", ...args);
}

/**
 * Logs the given arguments to the console with a warning layer.
 *
 * @param args The arguments to log.
 */
export function warning(...args: unknown[]): void {
  sim.log("[warning]", ...args);
}

/**
 * Logs the given arguments to the console with an error layer.
 *
 * @param args The arguments to log.
 */
export function error(...args: unknown[]): void {
  sim.log("[error]", ...args);
}
