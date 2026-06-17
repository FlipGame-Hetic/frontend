import type { Vector3Tuple } from "three"
import { BALL_RADIUS } from "@/components/balls/ballConfig"

export const BONUS_ZONE_RESTITUTION = 2
export const BONUS_ZONE_BOUNCE_THRESHOLD = 9
export const BONUS_ZONE_COOLDOWN_MS = 8000
export const MULTIBALL_SPAWN_POSITION1: Vector3Tuple = [-2.7, 1.6, -4.1]
export const MULTIBALL_SPAWN_POSITION2: Vector3Tuple = [2.1, 1.6, -4.1]
export const BONUS_ZONE_SPAWN_INTERVAL_MS = 150
export const MULTIBALL_BALL_COUNT = 3

export const BONUS_ZONE_BUMPER_BASE_NAMES = [
  "c_bumper_base_01",
  "c_bumper_base_02",
  "c_bumper_base_03",
] as const

export const MULTIBALL_GATE_REOPEN_DELAY_MS = 1000
export const MULTIBALL_GATE_CLOSE_DURATION_MS = 140
export const MULTIBALL_GATE_OPEN_DURATION_MS = 260
export const MULTIBALL_GATE_OPEN_DISTANCE = 0.3
export const MULTIBALL_GATE_TRIGGER_MIN_Z_VELOCITY = 0.1
export const MULTIBALL_GATE_HALF_EXTENTS: Vector3Tuple = [0.05, 0.35, 0.2]
export const MULTIBALL_GATE_POSITION: Vector3Tuple = [-0.3, 1.4, -3.05]
export const MULTIBALL_GATE_CLOSE_TRIGGER_Z = MULTIBALL_GATE_POSITION[2] - BALL_RADIUS
export const MULTIBALL_GATE_ARCH_BLOOM_INTENSITY = 30
