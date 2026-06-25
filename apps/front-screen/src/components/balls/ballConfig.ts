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

// Manually spawned ball preview
export const BALL_SPAWN_PREVIEW_OPACITY = 0.32
export const BALL_SPAWN_PREVIEW_COLLISION_COLOR = "#ff3333"
export const BALL_SPAWN_PREVIEW_ROTATION = { x: 0, y: 0, z: 0, w: 1 }
