// Approx. real earthly gravity value
export const GRAVITY_Y = -9.81
// Forward gravity that tilts the effective "down" to match the playfield slope, making the ball faster and unpredictable
export const GRAVITY_Z = 26
// Fixed 240 Hz step so a fast ball can't tunnel through thin colliders between frames
export const TIME_STEP = 1 / 240
export const SLOW_MOTION_SPEED = 0.25
