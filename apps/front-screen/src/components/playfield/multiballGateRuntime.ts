import type { CollisionPayload } from "@react-three/rapier"
import {
  MULTIBALL_GATE_CLOSE_DURATION_MS,
  MULTIBALL_GATE_CLOSE_TRIGGER_Z,
  MULTIBALL_GATE_OPEN_DURATION_MS,
  MULTIBALL_GATE_REOPEN_DELAY_MS,
  MULTIBALL_GATE_TRIGGER_MIN_Z_VELOCITY,
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

interface MultiballGateZVector {
  z: number
}

const DEFAULT_TIMING: MultiballGateTiming = {
  closeDurationMs: MULTIBALL_GATE_CLOSE_DURATION_MS,
  openDurationMs: MULTIBALL_GATE_OPEN_DURATION_MS,
}

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

export const isMultiballGateClosingVelocity = (
  velocity: MultiballGateZVector | null | undefined,
  minZVelocity = MULTIBALL_GATE_TRIGGER_MIN_Z_VELOCITY,
): boolean => {
  if (!velocity) return false
  return velocity.z < -Math.abs(minZVelocity)
}

const isMultiballGateOpeningVelocity = (
  velocity: MultiballGateZVector | null | undefined,
  minZVelocity = MULTIBALL_GATE_TRIGGER_MIN_Z_VELOCITY,
): boolean => {
  if (!velocity) return false
  return velocity.z > Math.abs(minZVelocity)
}

export const hasClearedMultiballGate = (
  position: MultiballGateZVector | null | undefined,
  triggerZ = MULTIBALL_GATE_CLOSE_TRIGGER_Z,
): boolean => {
  if (!position) return false
  return position.z <= triggerZ
}

export const shouldCloseMultiballGateFromSensor = (
  payload: CollisionPayload,
  minZVelocity = MULTIBALL_GATE_TRIGGER_MIN_Z_VELOCITY,
): boolean => {
  if (payload.other.rigidBodyObject?.name !== "ball") return false

  const velocity = payload.other.rigidBody?.linvel()
  return isMultiballGateClosingVelocity(velocity, minZVelocity)
}

export const shouldTrackMultiballGateSensorBall = (
  payload: CollisionPayload,
  minZVelocity = MULTIBALL_GATE_TRIGGER_MIN_Z_VELOCITY,
): boolean => {
  if (payload.other.rigidBodyObject?.name !== "ball") return false

  const velocity = payload.other.rigidBody?.linvel()
  return !!velocity && !isMultiballGateOpeningVelocity(velocity, minZVelocity)
}

export const shouldCloseMultiballGateFromSensorExit = (
  position: MultiballGateZVector | null | undefined,
  velocity: MultiballGateZVector | null | undefined,
  minZVelocity = MULTIBALL_GATE_TRIGGER_MIN_Z_VELOCITY,
): boolean => {
  return hasClearedMultiballGate(position) && isMultiballGateClosingVelocity(velocity, minZVelocity)
}
