const railBalls = new Set<string>()
const exitTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

import { RAIL_EXIT_DEBOUNCE_MS } from "./railConfig"

export const enterRail = (ballId: string): void => {
  const pending = exitTimeouts.get(ballId)
  if (pending !== undefined) {
    clearTimeout(pending)
    exitTimeouts.delete(ballId)
  }
  railBalls.add(ballId)
}

export const scheduleExitRail = (ballId: string): void => {
  const timeout = setTimeout(() => {
    railBalls.delete(ballId)
    exitTimeouts.delete(ballId)
  }, RAIL_EXIT_DEBOUNCE_MS)
  exitTimeouts.set(ballId, timeout)
}

export const isOnRail = (ballId: string): boolean => {
  return railBalls.has(ballId)
}

export const cleanupRailBall = (ballId: string): void => {
  const pending = exitTimeouts.get(ballId)
  if (pending !== undefined) clearTimeout(pending)
  railBalls.delete(ballId)
  exitTimeouts.delete(ballId)
}
