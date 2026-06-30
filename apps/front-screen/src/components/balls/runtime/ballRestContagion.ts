import type { BallPositionEntry } from "./ballPositionRegistry"

// Watchdog exemption spreads through resting balls so a ball stacked on a "seed" ball (craddled on a flipper or waiting in the plunger lane) is left alone too

// Balls currently at rest by design (on a flipper or in the plunger lane)
const seeds = new Set<string>()

// Publish each frame whether a ball is a seed (cradled on a flipper or waiting in the plunger lane)
export const setBallAtRest = (id: string, atRest: boolean): void => {
  if (atRest) seeds.add(id)
  else seeds.delete(id)
}

// Drops a ball's seed once it is gone, called from the ball's unmount cleanup
export const forgetBallContagion = (id: string): void => {
  seeds.delete(id)
}

// True when the ball is a seed or reaches one through a chain of balls within contactDistance of each other (BFS on a position snapshot, run only when the watchdog is about to act)
export const isRestingByContagion = (
  id: string,
  balls: BallPositionEntry[],
  contactDistance: number,
): boolean => {
  if (seeds.has(id)) return true

  const start = balls.find((b) => b.id === id)
  if (!start) return false

  const maxDistanceSq = contactDistance * contactDistance
  const visited = new Set<string>([id])
  const queue: BallPositionEntry[] = [start]

  while (queue.length > 0) {
    const current = queue.shift()
    if (current === undefined) break

    for (const other of balls) {
      if (visited.has(other.id)) continue

      const dx = current.x - other.x
      const dy = current.y - other.y
      const dz = current.z - other.z
      if (dx * dx + dy * dy + dz * dz > maxDistanceSq) continue

      if (seeds.has(other.id)) return true

      visited.add(other.id)
      queue.push(other)
    }
  }
  return false
}
