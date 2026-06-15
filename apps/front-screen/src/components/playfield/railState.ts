import { broadcastEvent } from "@frontend/ws"
import { RAIL_EXIT_DEBOUNCE_MS } from "./railConfig"

const railBalls = new Set<string>()
const exitTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

export const enterRail = (ballId: string): void => {
  const pending = exitTimeouts.get(ballId)
  if (pending !== undefined) {
    clearTimeout(pending)
    exitTimeouts.delete(ballId)
  }
  const wasOnRail = railBalls.has(ballId)
  railBalls.add(ballId)
  if (!wasOnRail) {
    broadcastEvent({ event_type: "RailStart", payload: { ball_id: ballId } })
  }
}

export const scheduleExitRail = (ballId: string): void => {
  const pending = exitTimeouts.get(ballId)
  if (pending !== undefined) clearTimeout(pending)
  const timeout = setTimeout(() => {
    railBalls.delete(ballId)
    exitTimeouts.delete(ballId)
    broadcastEvent({ event_type: "RailEnd", payload: { ball_id: ballId } })
  }, RAIL_EXIT_DEBOUNCE_MS)
  exitTimeouts.set(ballId, timeout)
}

export const isOnRail = (ballId: string): boolean => {
  return railBalls.has(ballId)
}

export const cleanupRailBall = (ballId: string): void => {
  const pending = exitTimeouts.get(ballId)
  if (pending !== undefined) clearTimeout(pending)
  const wasOnRail = railBalls.has(ballId)
  railBalls.delete(ballId)
  exitTimeouts.delete(ballId)
  if (wasOnRail) {
    broadcastEvent({ event_type: "RailEnd", payload: { ball_id: ballId } })
  }
}
