import type { PositionType } from "@/types/worldTypes"

export const BUMPER_POSITIONS: PositionType[] = [
  [-2.8, 0, -6],
  [2.8, 0, -6],
  [-2.8, 0, 6],
  [2.8, 0, 6],

  [1.5, 0, 2.8],
  [-1.5, 0, 2.8],
  [0, 0, 0],
  [-2.8, 0, 0],
  [2.8, 0, 0],
]

export const BUMPER_SIZE_ARGS: [number | undefined, number | undefined, number | undefined] = [
  0.5, 0.5, 0.5,
]
export const BUMPER_RESTITUTION = 0.3
export const BUMPER_IMPULSE_STRENGTH = 15
export const BUMPER_STUCK_FRAMES = 30
export const BUMPER_STUCK_VELOCITY = 0.5
export const BUMPER_UNSTICK_IMPULSE = 5

export const BUMPER_SCALE_FACTOR = 1.2
