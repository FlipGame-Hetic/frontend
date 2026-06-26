import type { Position3Type, PositionType } from "@/types/worldTypes"
import { Euler, Quaternion, Vector3 } from "three"

// Where the plunger sits on the table, tuned by hand to match the hole in the playfield model
export const PLUNGER_POSITION: PositionType = [4.5, 0.25, 9.5]
// Where a fresh ball is dropped so it lands in front of the plunger tip
export const PLUNGER_BALL_SPAWN: PositionType = [3.3, 0, 5]

export interface PlungerLanePoint {
  x: number
  y: number
  z: number
}

export const PLUNGER_LANE_GATE_POSITION: PositionType = [3.8, 1.7, -1.75]
export const PLUNGER_LANE_GATE_HALF_EXTENTS: PositionType = [0.8, 1, 0.7]
export const PLUNGER_LANE_GATE_ROTATION: PositionType = [0.2, 1.075, 0]

// The long thin box that covers the whole lane, used to tell when the ball is still travelling up the plunger lane
export const PLUNGER_LANE_SENSOR_POSITION: PositionType = [3.55, 0.5, 3.3]
const PLUNGER_LANE_SENSOR_HALF_EXTENTS: PositionType = [0.6, 0.8, 5]
const PLUNGER_LANE_SENSOR_ROTATION: PositionType = [0.2, 0, 0]

// The ball has to travel towards -Z to cross the gate
export const PLUNGER_LANE_GATE_NORMAL: PositionType = [0, 0, -1]

// True when the point is on the side that the gateNormal points to
export const isPastPlungerLaneGate = (
  point: Position3Type,
  gatePosition: PositionType,
  gateNormal: PositionType,
): boolean => {
  const [px, py, pz] = gatePosition
  const [nx, ny, nz] = gateNormal
  // Returns true if positive (the ball is past), if negative or 0 return false (ball is still in lane)
  return (point.x - px) * nx + (point.y - py) * ny + (point.z - pz) * nz > 0
}

export const isPointInPlungerLaneSensor = (point: Position3Type): boolean => {
  const [px, py, pz] = PLUNGER_LANE_SENSOR_POSITION
  const [hx, hy, hz] = PLUNGER_LANE_SENSOR_HALF_EXTENTS
  const [rx, ry, rz] = PLUNGER_LANE_SENSOR_ROTATION
  // Undo the rotation to prevent the tilt of the sensor box from making the min/max check wrong
  const inverseSensorRotation = new Quaternion().setFromEuler(new Euler(rx, ry, rz)).invert()
  const localPoint = new Vector3(point.x - px, point.y - py, point.z - pz).applyQuaternion(
    inverseSensorRotation,
  )

  // Check if the position of the point is within the half extents of the sensor
  return (
    Math.abs(localPoint.x) <= hx && Math.abs(localPoint.y) <= hy && Math.abs(localPoint.z) <= hz
  )
}

// The keyboard key that charges the plunger
export const PLUNGER_KEYBOARD_KEY = "Space"

// Size of the kinematic rod collider that actually pushes the ball
export const PLUNGER_ROD_RADIUS = 0.1
export const PLUNGER_ROD_LENGTH = 0.6

// When the model does not provide its own rings, fallback torus drawn to fake the spring
export const PLUNGER_FALLBACK_SPRINGS_COUNT = 5
export const PLUNGER_FALLBACK_SPRINGS_RADIUS = 0.12
export const PLUNGER_FALLBACK_SPRINGS_SPACING = 0.18

// Seconds of holding the key to go from rest to full charge, charge runs from 0 to 1 over this time
export const PLUNGER_MAX_CHARGE_TIME = 1.5
// 'Distance' that the plunger has traveled when charging fully
export const PLUNGER_MAX_COMPRESSION = 0.8

// Launch impulse range, the charge maps linearly between these values
export const PLUNGER_MIN_IMPULSE = 5
export const PLUNGER_MAX_IMPULSE = 100

// Low friction so the ball slides freely down the lane onto the tip
export const PLUNGER_LANE_FRICTION = 0.05

// Charge units per second the rod springs back, at 25 a full charge of 1 snaps back in about 0.04s
// When released and springing back into rest position, distance traveled by the rod in one second
export const PLUNGER_RELEASE_SPEED = 25

// A release below this value (in percentage, 1 being a full pull) is treated as noise and ignored
export const PLUNGER_MIN_CHARGE = 0.05
// Minimal launch charge (in percentage) to trigger launch sound and visuals
export const PLUNGER_MIN_LAUNCH_CHARGE = 0.18

// Pause in seconds after release before the rod starts springing back into rest (0.05s = 50ms)
export const PLUNGER_RELEASE_DELAY = 0.05
// Timeout in seconds before springing back into rest even when ball is still in lane (0.35s = 350ms)
export const PLUNGER_BALL_CLEAR_TIMEOUT = 0.35

// Keeps the charge between 0 and 1 and falls back to 0
export const clampPlungerPosition = (position: number): number => {
  if (!Number.isFinite(position)) return 0
  return Math.min(Math.max(position, 0), 1)
}

// Maps a 0 to 1 charge linearly onto the impulse range, 0 gives the min impulse and 1 gives the max
export const getPlungerImpulse = (position: number): number => {
  const charge = clampPlungerPosition(position)
  return PLUNGER_MIN_IMPULSE + (PLUNGER_MAX_IMPULSE - PLUNGER_MIN_IMPULSE) * charge
}
