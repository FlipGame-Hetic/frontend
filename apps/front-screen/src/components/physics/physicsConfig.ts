import { Vector3 } from "three"

// Approx. real earthly gravity value
export const GRAVITY_Y = -9.81
// Forward gravity that tilts the effective "down" to match the playfield slope, making the ball faster and unpredictable
export const GRAVITY_Z = 26
// Fixed 240 Hz step so a fast ball can't tunnel through thin colliders between frames
export const TIME_STEP = 1 / 240
export const SLOW_MOTION_SPEED = 0.25

// Cap the frame delta before scaling : rapier's step() runs a 1/240 accumulator, so one long frame would fire up to 120 catch-up substeps and cascade. 1/20 is a no-op at any frame rate >= 20fps and only engages when already hitching
export const MAX_FRAME_DELTA = 1 / 20

export const toVector3 = (
  position: [number, number, number] | { x: number; y: number; z: number },
): Vector3 => {
  if (Array.isArray(position)) {
    return new Vector3(position[0], position[1], position[2])
  }

  return new Vector3(position.x, position.y, position.z)
}
