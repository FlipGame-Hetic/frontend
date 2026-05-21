import type { Vector3Tuple } from "three"
import type { PositionType } from "@/types/worldTypes"

export interface LaneBoosterConfig {
  id: string
  position: PositionType
  halfExtents: Vector3Tuple
  entryAxis: "x" | "z"
  entrySign: -1 | 1
  defaultBoostX: number
  defaultBoostZ: number
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
    defaultBoostX: 10,
    defaultBoostZ: 15,
    defaultMinSpeed: 3,
    defaultCooldownMs: 400,
    lateralCenterX: -0.053,
  },
  {
    id: "l-rail",
    position: [-0.641, 0.2, -3.872],
    halfExtents: [2.224, 0.35, 0.05],
    entryAxis: "z",
    entrySign: -1,
    defaultBoostX: 0,
    defaultBoostZ: 12,
    defaultMinSpeed: 3,
    defaultCooldownMs: 400,
  },
  {
    id: "r-rail",
    position: [0.032, 0.2, -4.176],
    halfExtents: [2.219, 0.35, 0.05],
    entryAxis: "z",
    entrySign: -1,
    defaultBoostX: 0,
    defaultBoostZ: 12,
    defaultMinSpeed: 3,
    defaultCooldownMs: 400,
  },
  {
    id: "top-rail-left",
    position: [-2.571, 2.0, -5.464],
    halfExtents: [0.05, 0.717, 1.641],
    entryAxis: "x",
    entrySign: 1,
    defaultBoostX: 12,
    defaultBoostZ: 0,
    defaultMinSpeed: 3,
    defaultCooldownMs: 400,
  },
  {
    id: "top-rail-right",
    position: [3.537, 2.0, -5.464],
    halfExtents: [0.05, 0.717, 1.641],
    entryAxis: "x",
    entrySign: -1,
    defaultBoostX: -12,
    defaultBoostZ: 0,
    defaultMinSpeed: 3,
    defaultCooldownMs: 400,
  },
]
