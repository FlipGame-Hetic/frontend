import type { PositionType } from "@/types/worldTypes"

export const DEFAULT_BALL_SPAWN: PositionType = [0.4, 0.5, 2]

export const BALL_RADIUS = 0.157
export const BALL_MASS = 2.0
export const BALL_RESTITUTION = 0.4
export const BALL_FRICTION = 0.2
export const BALL_LINEAR_DAMPING = 0.015
export const BALL_ANGULAR_DAMPING = 0.1
export const BALL_MAX_TANGENT_SPEED = 50
export const BALL_LANE_MAX_TANGENT_SPEED = 100
export const BALL_MIN_NORMAL_SPEED = -30
export const BALL_MAX_NORMAL_SPEED = 0
export const BALL_SNAP_MAX_GAP = 0.3
export const BALL_SNAP_EPSILON = 0.005
export const BALL_EMISSIVE_INTENSITY = 2.5
