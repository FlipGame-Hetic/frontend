import { useCallback } from "react"
import type { Vector3Tuple } from "three"
import { useDebugControls } from "@/debug/debugContext"
import useMultiballStore from "@/stores/useMultiballStore"
import {
  BONUS_ZONE_COOLDOWN_MS,
  BONUS_ZONE_SPAWN_INTERVAL_MS,
  MULTIBALL_SPAWN_POSITION1,
  MULTIBALL_SPAWN_POSITION2,
} from "./bonusZoneConfig"

interface BonusZoneHitOptions {
  bounceThreshold: number
  ballCount: number
}

export const registerBonusZoneHit = (
  ballId: string,
  { bounceThreshold, ballCount }: BonusZoneHitOptions,
) => {
  if (!ballId) return

  const pos1: Vector3Tuple = [...MULTIBALL_SPAWN_POSITION1]
  const pos2: Vector3Tuple = [...MULTIBALL_SPAWN_POSITION2]

  useMultiballStore
    .getState()
    .registerBounce(
      ballId,
      bounceThreshold,
      pos1,
      pos2,
      BONUS_ZONE_SPAWN_INTERVAL_MS,
      BONUS_ZONE_COOLDOWN_MS,
      ballCount,
    )
}

export const useBonusZoneHitRegistrar = () => {
  const { bounceThreshold, ballCount } = useDebugControls()

  return useCallback(
    (ballId: string) => {
      registerBonusZoneHit(ballId, { bounceThreshold, ballCount })
    },
    [bounceThreshold, ballCount],
  )
}
