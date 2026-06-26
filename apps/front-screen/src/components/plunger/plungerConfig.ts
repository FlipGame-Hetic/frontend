import type { PositionType } from "@/types/worldTypes"
import { Euler, Quaternion, Vector3 } from "three"

export const PLUNGER_POSITION: PositionType = [4.5, 0.25, 9.5]
export const PLUNGER_BALL_SPAWN: PositionType = [3.3, 0, 5]

export interface PlungerLanePoint {
  x: number
  y: number
  z: number
}

export const PLUNGER_LANE_GATE_POSITION: PositionType = [3.8, 1.7, -1.75]
export const PLUNGER_LANE_GATE_HALF_EXTENTS: PositionType = [0.8, 1, 0.7]
export const PLUNGER_LANE_GATE_ROTATION: PositionType = [0.2, 1.075, 0]

export const PLUNGER_LANE_SENSOR_POSITION: PositionType = [3.55, 0.5, 3.3]
const PLUNGER_LANE_SENSOR_HALF_EXTENTS: PositionType = [0.6, 0.8, 5]
const PLUNGER_LANE_SENSOR_ROTATION: PositionType = [0.2, 0, 0]

export const PLUNGER_LANE_GATE_NORMAL: PositionType = [0, 0, -1]

export const isPastPlungerLaneGate = (
  point: PlungerLanePoint,
  gatePosition: PositionType,
  gateNormal: PositionType,
): boolean => {
  const [px, py, pz] = gatePosition
  const [nx, ny, nz] = gateNormal
  return (point.x - px) * nx + (point.y - py) * ny + (point.z - pz) * nz > 0
}

export const isPointInPlungerLaneSensor = (point: PlungerLanePoint): boolean => {
  const [px, py, pz] = PLUNGER_LANE_SENSOR_POSITION
  const [hx, hy, hz] = PLUNGER_LANE_SENSOR_HALF_EXTENTS
  const [rx, ry, rz] = PLUNGER_LANE_SENSOR_ROTATION
  // Inverse-rotate the point into the sensor's local frame to prevent a fake result
  const inverseSensorRotation = new Quaternion().setFromEuler(new Euler(rx, ry, rz)).invert()
  const localPoint = new Vector3(point.x - px, point.y - py, point.z - pz).applyQuaternion(
    inverseSensorRotation,
  )

  return (
    Math.abs(localPoint.x) <= hx && Math.abs(localPoint.y) <= hy && Math.abs(localPoint.z) <= hz
  )
}

export const PLUNGER_KEY = "Space"

export const PLUNGER_ROD_RADIUS = 0.1
export const PLUNGER_ROD_LENGTH = 0.6

export const PLUNGER_SPRING_TORUS_COUNT = 5
export const PLUNGER_SPRING_RADIUS = 0.12
export const PLUNGER_SPRING_SPACING = 0.18

export const PLUNGER_MAX_CHARGE_TIME = 1.5
export const PLUNGER_MAX_COMPRESSION = 0.8

// Launch impulse range, the charge maps linearly between these
export const PLUNGER_MIN_IMPULSE = 5
export const PLUNGER_MAX_IMPULSE = 100

export const PLUNGER_LANE_FRICTION = 0.05

export const PLUNGER_RELEASE_SPEED = 25

// Below this value, a release is ignored
export const PLUNGER_MIN_CHARGE = 0.05
// Below this value, it only bumps the ball instead of launching it (also used to trigger launching sound effects and visuals)
export const PLUNGER_MIN_LAUNCH_CHARGE = 0.18

// Short delay before the rod springs back
export const PLUNGER_RELEASE_DELAY = 0.05
// The longest it waits for the ball to leave the lane after a launch
export const PLUNGER_BALL_CLEAR_TIMEOUT = 0.35

// Clamps between 0 and 1 and adds a 0 fallback
export const clampPlungerPosition = (position: number): number => {
  if (!Number.isFinite(position)) return 0
  return Math.min(Math.max(position, 0), 1)
}

export const getPlungerImpulse = (position: number): number => {
  const charge = clampPlungerPosition(position)
  return PLUNGER_MIN_IMPULSE + (PLUNGER_MAX_IMPULSE - PLUNGER_MIN_IMPULSE) * charge
}
