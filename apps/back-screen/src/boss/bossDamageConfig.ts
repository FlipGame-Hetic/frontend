const BIG_DAMAGE_RATIO = 0.05

export function isBigDamage(delta: number, maxHp: number): boolean {
  if (delta <= 0 || maxHp <= 0) return false
  return delta >= maxHp * BIG_DAMAGE_RATIO
}

export function pickRandom<T>(list: readonly T[]): T | undefined {
  if (list.length === 0) return undefined
  return list[Math.floor(Math.random() * list.length)]
}
