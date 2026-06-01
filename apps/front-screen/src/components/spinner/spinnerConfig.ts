import type { Vector3Tuple } from "three"

export const SPINNER_SENSOR_HALF_EXTENTS: Vector3Tuple = [0.6, 0.5, 0.05]
export const SPINNER_GATE_AXIS = "z" as const
export const SPINNER_SPEED_TO_ANGULAR = 3.5
export const SPINNER_DECAY_PER_SECOND = 0.3
export const SPINNER_MIN_SPEED = 1.5
export const SPINNER_STOP_THRESHOLD = 0.05
