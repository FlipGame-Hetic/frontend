// Lives outside the useMultiballStore on purpose, in order to prevent React re-renders from collision callbacks, per-ball timestamps and spawn timers
import useBallStore from "@/stores/useBallStore"

const BOUNCE_DEBOUNCE_MS = 200

// Pending setTimeout handles for the ball spawns after a multiball trigger, so they can be counted and cancelled
const spawnTimers = new Set<ReturnType<typeof setTimeout>>()
// Last bounce timestamp per ball id, used to debounce the repeated collision callbacks of a single impact
const lastBounceTimeByBall = new Map<string, number>()

// Locked while a multiball is already running (more than one ball out) or about to start (spawns still pending), so new bounces can't re-trigger or be counted
export const isMultiballCounterLocked = (): boolean => {
  return useBallStore.getState().playingBallIds.length > 1 || spawnTimers.size > 0
}

// Drops debounced bounces older than the performance window so the lastBounceTimeByBall map can't grow unbounded
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

// Registers a pending spawn timer so it counts toward the lock and can be cancelled on reset
export const trackSpawnTimer = (timer: ReturnType<typeof setTimeout>): void => {
  spawnTimers.add(timer)
}

export const untrackSpawnTimer = (timer: ReturnType<typeof setTimeout>): void => {
  spawnTimers.delete(timer)
}

// Cancels every pending spawn and wipes debounce state, called on game reset
export const clearMultiballBounceState = (): void => {
  for (const t of spawnTimers) clearTimeout(t)
  spawnTimers.clear()
  lastBounceTimeByBall.clear()
}

// Read-only counters for test files
export const getMultiballDebugSnapshot = () => {
  pruneExpiredBounceTimes()

  return {
    spawnTimers: spawnTimers.size,
    lastBounceTimes: lastBounceTimeByBall.size,
    lockedByActiveMultiball: isMultiballCounterLocked(),
  }
}
