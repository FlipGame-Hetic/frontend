import type { PositionType } from "@/types/worldTypes"

export const REST_ANGLE = -0.5
export const MAX_ANGLE = 0.75
export const MOTOR_STIFFNESS = 4000
export const MOTOR_DAMPING = 50

export const FLIPPER_JOINT_MASS = 8.0
export const FLIPPER_RESTITUTION = 0.001
export const FLIPPER_FRICTION = 0.02
export const GUTTER_RESTITUTION = 0
export const GUTTER_FRICTION = FLIPPER_FRICTION

export const FLIPPER_IMPULSE_MULTIPLIER = 1.5
export const FLIPPER_ANGVEL_THRESHOLD = 0.5
export const FLIPPER_IMPACT_SPEED_THRESHOLD = 0.75
export const FLIPPER_BALL_SPEED_CONTRIBUTION = 0.35
export const FLIPPER_MIN_IMPULSE = 0
export const FLIPPER_MAX_IMPULSE = 120
export const FLIPPER_PIVOT_TO_TIP = 0.9

export const LEFT_POSITION: PositionType = [-1.475, 0.3, 9.5]
export const RIGHT_POSITION: PositionType = [1.475, 0.3, 9.5]

export const FLIPPER_MESH_OFFSET_X = 0.45

export const LEFT_KEYS = ["ShiftLeft", "ArrowLeft", "KeyA"]
export const RIGHT_KEYS = ["ShiftRight", "ArrowRight", "KeyD"]
