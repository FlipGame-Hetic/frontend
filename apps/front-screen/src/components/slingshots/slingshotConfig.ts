import type { PositionType } from "@/types/worldTypes"

interface SlingshotConfig {
  position: PositionType
  side: "left" | "right"
}

export const SLINGSHOT_CONFIGS: SlingshotConfig[] = [
  { position: [-0.19, 0.02, 0.5], side: "left" },
  { position: [0.19, 0.02, 0.5], side: "right" },
]

export const SLINGSHOT_WIDTH = 0.09
export const SLINGSHOT_DEPTH = 0.09
export const SLINGSHOT_HEIGHT = 0.033
export const SLINGSHOT_RESTITUTION = 7

export const SLINGSHOT_TREMBLE_DURATION = 0.3
export const SLINGSHOT_TREMBLE_AMP = 0.003
export const SLINGSHOT_TREMBLE_FREQ = 80

export const SLINGSHOT_STUCK_FRAMES = 30
export const SLINGSHOT_STUCK_VELOCITY = 0.033
export const SLINGSHOT_UNSTICK_IMPULSE = 0.33
