import type { Vector3Tuple } from "three"
import type { PositionType } from "@/types/worldTypes"

export interface LaneBoosterConfig {
  id: string
  position: PositionType
  halfExtents: Vector3Tuple
  entryAxis: "x" | "z"
  entrySign: -1 | 1
  defaultBoostDirX: number
  defaultBoostDirZ: number
  defaultBoostSpeed: number
  defaultMinSpeed: number
  defaultCooldownMs: number
  lateralCenterX?: number
}

export const LANE_BOOSTER_CONFIGS: LaneBoosterConfig[] = [
  {
    id: "tunnel",
    position: [-0.053, 0.2, -7.24],
    halfExtents: [3.587, 0.35, 0.05],
    entryAxis: "z",
    entrySign: -1,
    defaultBoostDirX: 1,
    defaultBoostDirZ: 1,
    defaultBoostSpeed: 35,
    defaultMinSpeed: 5,
    defaultCooldownMs: 400,
    lateralCenterX: -0.053,
  },
  {
    id: "l-rail",
    position: [-0.641, 0.2, -3.872],
    halfExtents: [2.224, 0.35, 0.05],
    entryAxis: "z",
    entrySign: -1,
    defaultBoostDirX: 0,
    defaultBoostDirZ: 1,
    defaultBoostSpeed: 25,
    defaultMinSpeed: 5,
    defaultCooldownMs: 400,
  },
  {
    id: "r-rail",
    position: [0.032, 0.2, -4.176],
    halfExtents: [2.219, 0.35, 0.05],
    entryAxis: "z",
    entrySign: -1,
    defaultBoostDirX: 0,
    defaultBoostDirZ: 1,
    defaultBoostSpeed: 25,
    defaultMinSpeed: 5,
    defaultCooldownMs: 400,
  },
]
