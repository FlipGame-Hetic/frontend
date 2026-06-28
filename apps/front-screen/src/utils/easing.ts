export const easeLinear = (t: number): number => t

export const easeOutCubic = (t: number): number => {
  return 1 - (1 - t) ** 3
}

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
}

export const easeOutBack = (t: number): number => {
  // 1.70158 is the canonical easeOutBack overshoot magic, c3 governs how far the curve backswings past the target
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
}
