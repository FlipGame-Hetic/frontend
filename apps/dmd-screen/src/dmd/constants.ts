export const MAX_BALLS = 3

// Heart icon is 5px wide with 2px gap between hearts
export const HEART_SPACING = 7

/** Total pixel width of a row of `count` hearts */
export function heartsWidth(count: number): number {
  return count * HEART_SPACING - 2
}
