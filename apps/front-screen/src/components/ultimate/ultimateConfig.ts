import type { Vector3Tuple } from "three"
import type { CharacterType, UltiId } from "@frontend/types"

interface UltimateOverlayConfig {
  position: Vector3Tuple
  distanceFactor: number
  renderOrder: number
  iconSize: number
  barWidth: number
  barHeight: number
}

export const MULTIBALL_SPLIT_SPAWN_POSITIONS: readonly Vector3Tuple[] = [
  [1.35, 1.5, -4.1],
  [-2, 1.5, -4.1],
]

export const DEFAULT_SLOW_FACTOR = 0.25

export const RAMPAGE_TIME_SCALE = 1.25

export const ULTIMATE_ICON_BASE_PATH = "/ultimateIcons"

export const CHARACTER_BY_ULTI_ID: Record<UltiId, CharacterType> = {
  multiball_split: "enforcer",
  rampage: "viper",
  time_slow: "oracle",
  mimic: "ghost",
}

export const ULTIMATE_OVERLAY_CONFIG = {
  position: [2.25, 1.05, 6.6],
  distanceFactor: 2,
  renderOrder: 920,
  iconSize: 52,
  barWidth: 200,
  barHeight: 18,
} as const satisfies UltimateOverlayConfig
