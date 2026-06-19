/**
 * Returns `true` during the "on" half of a blink cycle and `false` during the
 * "off" half. A full cycle is `2 * periodMs` (on for `periodMs`, off for `periodMs`).
 */
export function blink(elapsedMs: number, periodMs: number): boolean {
  return Math.floor(elapsedMs / periodMs) % 2 === 0
}
