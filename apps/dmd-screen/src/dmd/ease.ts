/** Pure easing functions. Each maps t in [0, 1] to an eased [0, 1] (input clamped). */

export type EaseFn = (t: number) => number

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t)

export const linear: EaseFn = (t) => clamp01(t)

export const easeOutCubic: EaseFn = (t) => {
  const x = clamp01(t)
  return 1 - Math.pow(1 - x, 3)
}

export const easeInCubic: EaseFn = (t) => {
  const x = clamp01(t)
  return x * x * x
}

export const easeOutQuad: EaseFn = (t) => {
  const x = clamp01(t)
  return 1 - (1 - x) * (1 - x)
}

export const easeInOutQuad: EaseFn = (t) => {
  const x = clamp01(t)
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}

/** Overshoots past 1 near the end before settling — good for a "pop" entrance. */
export const easeOutBack: EaseFn = (t) => {
  const x = clamp01(t)
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}
