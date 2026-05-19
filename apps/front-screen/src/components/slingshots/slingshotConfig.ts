import type { PositionType } from "@/types/worldTypes"

interface SlingshotConfig {
  position: PositionType
  side: "left" | "right"
}

export const SLINGSHOT_CONFIGS: SlingshotConfig[] = [
  { position: [-2.8, 0.3, 7.5], side: "left" },
  { position: [2.8, 0.3, 7.5], side: "right" },
]

export const SLINGSHOT_WIDTH = 1.4
export const SLINGSHOT_DEPTH = 1.4
export const SLINGSHOT_HEIGHT = 0.5
export const SLINGSHOT_RESTITUTION = 7

export const SLINGSHOT_TREMBLE_DURATION = 0.3
export const SLINGSHOT_TREMBLE_AMP = 0.05
export const SLINGSHOT_TREMBLE_FREQ = 80

export const SLINGSHOT_STUCK_FRAMES = 30
export const SLINGSHOT_STUCK_VELOCITY = 0.5
export const SLINGSHOT_UNSTICK_IMPULSE = 5
