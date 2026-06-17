import { BALL_RADIUS } from "@/components/balls/ballConfig"
import {
  MULTIBALL_GATE_CLOSE_DURATION_MS,
  MULTIBALL_GATE_CLOSE_TRIGGER_Z,
  MULTIBALL_GATE_HALF_EXTENTS,
  MULTIBALL_GATE_OPEN_DURATION_MS,
  MULTIBALL_GATE_REOPEN_DELAY_MS,
} from "./bonusZoneConfig"

type MultiballGatePhase = "open" | "closing" | "closed" | "opening"

export interface MultiballGateState {
  phase: MultiballGatePhase
  phaseStartedAt: number
  phaseStartAmount: number
  closedAmount: number
  reopenAt: number
  colliderActive: boolean
}

export interface MultiballGateTiming {
  closeDurationMs: number
  openDurationMs: number
}

export type MultiballGateTraversal = "entry-to-bonus" | "exit-to-playfield" | "none"

interface MultiballGateVector {
  x: number
  y: number
  z: number
}

interface MultiballGateZVector {
  z: number
}

const DEFAULT_TIMING: MultiballGateTiming = {
  closeDurationMs: MULTIBALL_GATE_CLOSE_DURATION_MS,
  openDurationMs: MULTIBALL_GATE_OPEN_DURATION_MS,
}
const MULTIBALL_GATE_LOCAL_CLOSE_Z = -BALL_RADIUS

const progress = (startedAt: number, now: number, durationMs: number): number => {
  if (durationMs <= 0) return 1
  return Math.min(1, Math.max(0, (now - startedAt) / durationMs))
}

export const createOpenMultiballGateState = (): MultiballGateState => ({
  phase: "open",
  phaseStartedAt: 0,
  phaseStartAmount: 0,
  closedAmount: 0,
  reopenAt: 0,
  colliderActive: false,
})

export const triggerMultiballGateClose = (
  state: MultiballGateState,
  now: number,
  reopenDelayMs = MULTIBALL_GATE_REOPEN_DELAY_MS,
): MultiballGateState => {
  if (state.phase !== "open") return state

  return {
    phase: "closing",
    phaseStartedAt: now,
    phaseStartAmount: state.closedAmount,
    closedAmount: state.closedAmount,
    reopenAt: now + reopenDelayMs,
    colliderActive: true,
  }
}

export const advanceMultiballGateState = (
  state: MultiballGateState,
  now: number,
  timing: MultiballGateTiming = DEFAULT_TIMING,
): MultiballGateState => {
  if (state.phase === "closing") {
    const t = progress(state.phaseStartedAt, now, timing.closeDurationMs)
    const closedAmount = state.phaseStartAmount + (1 - state.phaseStartAmount) * t

    if (t >= 1) {
      return {
        ...state,
        phase: "closed",
        phaseStartedAt: now,
        phaseStartAmount: 1,
        closedAmount: 1,
      }
    }

    return { ...state, closedAmount }
  }

  if (state.phase === "closed") {
    if (now < state.reopenAt) return { ...state, closedAmount: 1, colliderActive: true }

    return {
      ...state,
      phase: "opening",
      phaseStartedAt: now,
      phaseStartAmount: 1,
      closedAmount: 1,
      colliderActive: false,
    }
  }

  if (state.phase === "opening") {
    const t = progress(state.phaseStartedAt, now, timing.openDurationMs)
    const closedAmount = state.phaseStartAmount * (1 - t)

    if (t >= 1) {
      return createOpenMultiballGateState()
    }

    return { ...state, closedAmount, colliderActive: false }
  }

  return { ...state, closedAmount: 0, colliderActive: false }
}

export const hasClearedMultiballGate = (
  position: MultiballGateZVector | null | undefined,
  triggerZ = MULTIBALL_GATE_CLOSE_TRIGGER_Z,
): boolean => {
  if (!position) return false
  return position.z <= triggerZ
}

export const isWithinMultiballGateCrossingBounds = (
  position: MultiballGateVector,
  halfExtents = MULTIBALL_GATE_HALF_EXTENTS,
  margin = BALL_RADIUS,
): boolean => {
  return (
    Math.abs(position.x) <= halfExtents[0] + margin &&
    Math.abs(position.y) <= halfExtents[1] + margin
  )
}

export const classifyMultiballGateTraversal = (
  previous: MultiballGateVector | null | undefined,
  current: MultiballGateVector | null | undefined,
  closePlaneZ = MULTIBALL_GATE_LOCAL_CLOSE_Z,
): MultiballGateTraversal => {
  if (!previous || !current) return "none"

  const deltaZ = current.z - previous.z
  if (deltaZ === 0) return "none"

  const entersBonus = previous.z > closePlaneZ && current.z <= closePlaneZ
  const exitsToPlayfield = previous.z < closePlaneZ && current.z >= closePlaneZ
  if (!entersBonus && !exitsToPlayfield) return "none"

  const t = (closePlaneZ - previous.z) / deltaZ
  if (t < 0 || t > 1) return "none"

  const crossingPoint = {
    x: previous.x + (current.x - previous.x) * t,
    y: previous.y + (current.y - previous.y) * t,
    z: closePlaneZ,
  }
  if (!isWithinMultiballGateCrossingBounds(crossingPoint)) return "none"

  return entersBonus ? "entry-to-bonus" : "exit-to-playfield"
}

export const shouldKeepMultiballGateExitSuppression = (
  position: MultiballGateVector,
  halfExtents = MULTIBALL_GATE_HALF_EXTENTS,
  margin = BALL_RADIUS,
): boolean => {
  return (
    Math.abs(position.x) <= halfExtents[0] + margin &&
    Math.abs(position.y) <= halfExtents[1] + margin &&
    position.z > -halfExtents[2] - margin &&
    position.z < halfExtents[2] + margin
  )
}
