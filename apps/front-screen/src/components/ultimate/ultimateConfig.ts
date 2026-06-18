import type { Vector3Tuple } from "three"
import {
  MULTIBALL_SPAWN_POSITION1,
  MULTIBALL_SPAWN_POSITION2,
} from "@/components/playfield/bonusZoneConfig"

interface UltimateOverlayConfig {
  position: Vector3Tuple
  distanceFactor: number
  renderOrder: number
  iconSize: number
  barWidth: number
  barHeight: number
}

export const MULTIBALL_SPLIT_SPAWN_POSITIONS: readonly Vector3Tuple[] = [
  MULTIBALL_SPAWN_POSITION1,
  MULTIBALL_SPAWN_POSITION2,
]

export const DEFAULT_SLOW_FACTOR = 0.25

export const RAMPAGE_TIME_SCALE = 1.25

export const ULTIMATE_ICON_BASE_PATH = "/ultimateIcons"

export const ULTIMATE_OVERLAY_CONFIG = {
  position: [2.25, 1.05, 6.6],
  distanceFactor: 2,
  renderOrder: 920,
  iconSize: 52,
  barWidth: 200,
  barHeight: 18,
} as const satisfies UltimateOverlayConfig

// DEBUG ULTIMATE TEST: force the HUD ready while tuning character ultimates. Remove later.
export const DEBUG_FORCE_ULTIMATE_READY: boolean = import.meta.env.DEV
