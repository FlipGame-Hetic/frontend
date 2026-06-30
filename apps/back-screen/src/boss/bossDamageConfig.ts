const BIG_DAMAGE_THRESHOLD = 500

export function isBigDamage(delta: number): boolean {
  if (delta <= 0) return false
  return delta >= BIG_DAMAGE_THRESHOLD
}

export function pickRandom<T>(list: readonly T[]): T | undefined {
  if (list.length === 0) return undefined
  return list[Math.floor(Math.random() * list.length)]
}
