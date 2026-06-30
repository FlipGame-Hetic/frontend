import type { Vector3Tuple } from "three"
import { BALL_RADIUS } from "@/components/balls/ballConfig"

// Make the ball bounce off of the walls
export const BONUS_ZONE_RESTITUTION = 2
// How many bounces a ball has to rack up inside the zone before the multiball triggers
export const BONUS_ZONE_BOUNCE_THRESHOLD = 9
export const MULTIBALL_SPAWN_POSITION1: Vector3Tuple = [-2.7, 1.6, -4.1]
export const MULTIBALL_SPAWN_POSITION2: Vector3Tuple = [2.1, 1.6, -4.1]
// Wait between each extra ball spawn so they don't all pop in on the same frame
export const BONUS_ZONE_SPAWN_INTERVAL_MS = 150
export const MULTIBALL_BALL_COUNT = 3

export const BONUS_ZONE_BUMPER_BASE_NAMES = ["c_bumper_base"] as const

// Once the gate has closed, how long it stays shut before opening again
export const MULTIBALL_GATE_REOPEN_DELAY_MS = 1000
// The gate snaps shut faster than it slides back open
export const MULTIBALL_GATE_CLOSE_DURATION_MS = 140
export const MULTIBALL_GATE_OPEN_DURATION_MS = 260
// How far each door slides away from the center when the gate is fully open
export const MULTIBALL_GATE_OPEN_DISTANCE = 0.3
// Speed needed from the ball toward -Z to count as crossing the gate
export const MULTIBALL_GATE_TRIGGER_MIN_Z_VELOCITY = 0.1
export const MULTIBALL_GATE_HALF_EXTENTS: Vector3Tuple = [0.08, 0.45, 0.45]
export const MULTIBALL_GATE_POSITION: Vector3Tuple = [-0.3, 1.4, -3.05]
// Adds the ball radius to the gate position, to wait until after the ball has crossed the gate before closing
export const MULTIBALL_GATE_CLOSE_TRIGGER_Z = MULTIBALL_GATE_POSITION[2] - BALL_RADIUS
export const MULTIBALL_GATE_ARCH_OPEN_COLOR = "#55eae5"
// Differents brightness level for the open/closed gate
export const MULTIBALL_GATE_ARCH_BLOOM_INTENSITY = 15
export const MULTIBALL_GATE_ARCH_CLOSED_BLOOM_INTENSITY = 32
