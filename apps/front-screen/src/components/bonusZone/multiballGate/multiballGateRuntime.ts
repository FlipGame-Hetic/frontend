import type { CollisionPayload } from "@react-three/rapier"
import {
  MULTIBALL_GATE_CLOSE_DURATION_MS,
  MULTIBALL_GATE_CLOSE_TRIGGER_Z,
  MULTIBALL_GATE_OPEN_DURATION_MS,
  MULTIBALL_GATE_REOPEN_DELAY_MS,
  MULTIBALL_GATE_TRIGGER_MIN_Z_VELOCITY,
} from "../bonusZoneConfig"

// The gate cycles open then closing then closed then opening and back to open
type MultiballGatePhase = "open" | "closing" | "closed" | "opening"

export interface MultiballGateState {
  phase: MultiballGatePhase
  // When the current phase began, used to measure how far along the close or open animation is
  phaseStartedAt: number
  // How closed the gate was when the phase began, so an interrupted animation can pick up from there
  phaseStartAmount: number
  // 0 means fully open, 1 means fully closed, the doors and bloom are driven from this
  closedAmount: number
  // Timestamp at which a closed gate is allowed to start opening again
  reopenAt: number
  // True when the solid blocking collider should exist, when closing or closed
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

// Fraction of the animation that has elapsed, clamped between 0 at the start and 1 once done
const progress = (startedAt: number, now: number, durationMs: number): number => {
  if (durationMs <= 0) return 1
  return Math.min(1, Math.max(0, (now - startedAt) / durationMs))
}

// Fresh state for a fully open gate with no collider, the resting state between multiballs
export const createOpenMultiballGateState = (): MultiballGateState => ({
  phase: "open",
  phaseStartedAt: 0,
  phaseStartAmount: 0,
  closedAmount: 0,
  reopenAt: 0,
  colliderActive: false,
})

// Kicks an open gate into its closing phase and schedules when it may reopen, ignored if not open
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

// Steps the gate to where it should be at the current time, advancing phases as their timers run out
export const advanceMultiballGateState = (
  state: MultiballGateState,
  now: number,
  timing: MultiballGateTiming = DEFAULT_TIMING,
): MultiballGateState => {
  if (state.phase === "closing") {
    // Ease from however closed it already was up to fully closed (0 -> 1)
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
    // Stay shut and solid until the reopen delay has passed
    if (now < state.reopenAt) return { ...state, closedAmount: 1, colliderActive: true }

    // Delay is over, drop the solid collider and start sliding the doors open
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
    // Ease from fully closed back down to fully open over the open duration
    const t = progress(state.phaseStartedAt, now, timing.openDurationMs)
    const closedAmount = state.phaseStartAmount * (1 - t)

    if (t >= 1) {
      return createOpenMultiballGateState()
    }

    return { ...state, closedAmount, colliderActive: false }
  }

  // Already open, nothing to advance
  return { ...state, closedAmount: 0, colliderActive: false }
}

// True when the ball is moving the -Z direction toward the back fast enough to close the gate
export const isMultiballGateClosingVelocity = (
  velocity: MultiballGateZVector | null | undefined,
  minZVelocity = MULTIBALL_GATE_TRIGGER_MIN_Z_VELOCITY,
): boolean => {
  if (!velocity) return false
  return velocity.z < -Math.abs(minZVelocity)
}

// True when the ball is moving back toward +Z, the direction that would leave the gate the way it came
const isMultiballGateOpeningVelocity = (
  velocity: MultiballGateZVector | null | undefined,
  minZVelocity = MULTIBALL_GATE_TRIGGER_MIN_Z_VELOCITY,
): boolean => {
  if (!velocity) return false
  return velocity.z > Math.abs(minZVelocity)
}

// True once the ball has passed the trigger line and is not considered in the gate anymore
export const hasClearedMultiballGate = (
  position: MultiballGateZVector | null | undefined,
  triggerZ = MULTIBALL_GATE_CLOSE_TRIGGER_Z,
): boolean => {
  if (!position) return false
  return position.z <= triggerZ
}

// A ball entering the sensor while heading inward should slam the gate shut behind it
export const shouldCloseMultiballGateFromSensor = (
  payload: CollisionPayload,
  minZVelocity = MULTIBALL_GATE_TRIGGER_MIN_Z_VELOCITY,
): boolean => {
  if (payload.other.rigidBodyObject?.name !== "ball") return false

  const velocity = payload.other.rigidBody?.linvel()
  return isMultiballGateClosingVelocity(velocity, minZVelocity)
}

// A ball in the sensor that doesn't have enough velocity to cross is still worth tracking as it could cross later
export const shouldTrackBallInSensor = (
  payload: CollisionPayload,
  minZVelocity = MULTIBALL_GATE_TRIGGER_MIN_Z_VELOCITY,
): boolean => {
  if (payload.other.rigidBodyObject?.name !== "ball") return false

  const velocity = payload.other.rigidBody?.linvel()
  return !!velocity && !isMultiballGateOpeningVelocity(velocity, minZVelocity)
}

// Close the gate when a ball leaves the sensor only if it left past the gate and still moving inward
export const shouldCloseMultiballGateFromSensorExit = (
  position: MultiballGateZVector | null | undefined,
  velocity: MultiballGateZVector | null | undefined,
  minZVelocity = MULTIBALL_GATE_TRIGGER_MIN_Z_VELOCITY,
): boolean => {
  return hasClearedMultiballGate(position) && isMultiballGateClosingVelocity(velocity, minZVelocity)
}
