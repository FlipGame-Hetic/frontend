/**
 * Non-reactive multiball bounce State (see apps/front-screen/README.md → State management).
 * Lives outside useMultiballStore on purpose: these spawn timers and per-ball
 * timestamps are written from collision callbacks at play speed and must never
 * trigger a React re-render. The Zustand store keeps only the reactive bounceCount.
 */
import useBallStore from "@/stores/useBallStore"

const BOUNCE_DEBOUNCE_MS = 200

const spawnTimers = new Set<ReturnType<typeof setTimeout>>()
const lastBounceTimeByBall = new Map<string, number>()

export const isMultiballCounterLocked = (): boolean => {
  return useBallStore.getState().playingBallIds.length > 1 || spawnTimers.size > 0
}

export const pruneExpiredBounceTimes = (now = performance.now()): void => {
  for (const [ballId, lastTime] of lastBounceTimeByBall) {
    if (now - lastTime >= BOUNCE_DEBOUNCE_MS) lastBounceTimeByBall.delete(ballId)
  }
}

export const isBounceDebounced = (ballId: string, now: number): boolean => {
  const lastTime = lastBounceTimeByBall.get(ballId)
  return lastTime !== undefined && now - lastTime < BOUNCE_DEBOUNCE_MS
}

export const recordBounceTime = (ballId: string, now: number): void => {
  lastBounceTimeByBall.set(ballId, now)
}

export const trackSpawnTimer = (timer: ReturnType<typeof setTimeout>): void => {
  spawnTimers.add(timer)
}

export const untrackSpawnTimer = (timer: ReturnType<typeof setTimeout>): void => {
  spawnTimers.delete(timer)
}

export const clearMultiballBounceState = (): void => {
  for (const t of spawnTimers) clearTimeout(t)
  spawnTimers.clear()
  lastBounceTimeByBall.clear()
}

export const getMultiballDebugSnapshot = () => {
  pruneExpiredBounceTimes()

  return {
    spawnTimers: spawnTimers.size,
    lastBounceTimes: lastBounceTimeByBall.size,
    lockedByActiveMultiball: isMultiballCounterLocked(),
  }
}
