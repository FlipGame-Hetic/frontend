import type { PositionType } from "@/types/worldTypes"

export const REST_ANGLE = 0
export const MAX_ANGLE = 1.2

export const FLIPPER_ACTIVE_TILT_X_DEG = -7.5
export const FLIPPER_ACTIVE_TILT_Z_DEG = 7.5
export const MOTOR_SPEED = 35
export const MOTOR_STIFFNESS = 4000
export const MOTOR_DAMPING = 50

export const FLIPPER_JOINT_MASS = 8.0
export const FLIPPER_RESTITUTION = 0.001
export const FLIPPER_FRICTION = 0.02
export const GUTTER_RESTITUTION = 0
export const GUTTER_FRICTION = FLIPPER_FRICTION

export const LEFT_POSITION: PositionType = [-1.475, 0.3, 9.5]
export const RIGHT_POSITION: PositionType = [1.475, 0.3, 9.5]

export const FLIPPER_MESH_OFFSET_X = 0.45

export const LEFT_KEYS = ["ShiftLeft", "ArrowLeft", "KeyA"]
export const RIGHT_KEYS = ["ShiftRight", "ArrowRight", "KeyD"]
