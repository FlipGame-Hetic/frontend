import type { PositionType } from "@/types/worldTypes"

export const BUMPER_POSITIONS: PositionType[] = [
  [0.1, 0, 0.19],
  [-0.1, 0, 0.19],
  [-0.19, 0, 0],
  [0.19, 0, 0],
]

export const BUMPER_SIZE_ARGS: [number | undefined, number | undefined, number | undefined] = [
  0.033, 0.033, 0.033,
]
export const BUMPER_RESTITUTION = 0.3
export const BUMPER_IMPULSE_STRENGTH = 1
export const BUMPER_STUCK_FRAMES = 30
export const BUMPER_STUCK_VELOCITY = 0.033
export const BUMPER_UNSTICK_IMPULSE = 0.33

export const BUMPER_SCALE_FACTOR = 1.2
