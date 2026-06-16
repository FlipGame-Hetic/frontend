import { broadcastEvent } from "@frontend/ws"
import { startLoopingSfx, stopLoopingSfx } from "@/audio/soundEngine"

interface RailBallState {
  sources: Set<string>
}

const DEFAULT_RAIL_SOURCE = "rail-sensor"
const railBalls = new Map<string, RailBallState>()

const endRail = (ballId: string): void => {
  railBalls.delete(ballId)
  broadcastEvent({ event_type: "RailEnd", payload: { ball_id: ballId } })
  stopLoopingSfx("ramp_rolling", ballId)
}

export const enterRail = (ballId: string, source = DEFAULT_RAIL_SOURCE): void => {
  const existing = railBalls.get(ballId)
  if (existing) {
    existing.sources.add(source)
    return
  }

  railBalls.set(ballId, { sources: new Set([source]) })
  broadcastEvent({ event_type: "RailStart", payload: { ball_id: ballId } })
  startLoopingSfx("ramp_rolling", ballId)
}

export const exitRailNow = (ballId: string): void => {
  const state = railBalls.get(ballId)
  if (!state) return
  state.sources.clear()
  endRail(ballId)
}

export const isOnRail = (ballId: string): boolean => {
  return railBalls.has(ballId)
}

export const cleanupRailBall = (ballId: string): void => {
  if (!railBalls.has(ballId)) return
  endRail(ballId)
}
