import type { PositionType } from "@/types/worldTypes"

export const DEFAULT_BALL_SPAWN: PositionType = [0.4, 0.5, 2]

export const BALL_RADIUS = 0.157
export const BALL_MASS = 2.0
export const BALL_RESTITUTION = 0.4
export const BALL_FRICTION = 0.2
export const BALL_LINEAR_DAMPING = 0.015
export const BALL_ANGULAR_DAMPING = 0.1
// Speed limit for the ball to prevent infinite speed accumulation from multiple bumpers' bounce
export const BALL_MAX_TANGENT_SPEED = 50
// Higher cap inside the plunger lane so a full-power launch isn't throttled
export const BALL_LANE_MAX_TANGENT_SPEED = 100
// Normal speed is clamped to [-30, 0] : the ball can be pressed onto the plane but never lifted off it
export const BALL_MIN_NORMAL_SPEED = -30
export const BALL_MAX_NORMAL_SPEED = 0
// How far below the ball the snap ray looks for ground, and the dead-zone gap small enough to leave uncorrected
export const BALL_SNAP_MAX_GAP = 0.3
export const BALL_SNAP_EPSILON = 0.005

// Stuck-ball watchdog : speed (well below normal play) under which a ball is considered wedged
export const BALL_STUCK_VELOCITY = 0.5
// Frames of continuous low speed before the first unstick attempt (~2s at 60fps)
export const BALL_STUCK_FRAMES_BEFORE_ATTEMPT = 120
// After a nudge, number of frames of continuous low speed that mark the attempt as failed and trigger the next one (on 60fps)
export const BALL_STUCK_RESTUCK_FRAMES = 90
// Window watched after a nudge : if the ball never re-sticks within it, the attempt is a success (on 60fps)
export const BALL_STUCK_OBSERVE_FRAMES = 300
// Random 2D nudges tried before giving up and teleporting the ball to safety
export const BALL_STUCK_MAX_IMPULSE_ATTEMPTS = 3
// Strength of each unstick nudge
export const BALL_UNSTICK_IMPULSE = 5
// Center-to-center distance under which two balls count as touching for the watchdog cradle contagion, just over 2*radius since physics keeps their centers apart
export const BALL_REST_CONTACT_DISTANCE = BALL_RADIUS * 2 * 1.08

// Manually spawned ball preview
export const BALL_SPAWN_PREVIEW_OPACITY = 0.32
export const BALL_SPAWN_PREVIEW_COLLISION_COLOR = "#ff3333"
export const BALL_SPAWN_PREVIEW_ROTATION = { x: 0, y: 0, z: 0, w: 1 }
