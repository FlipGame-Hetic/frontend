import { useCallback } from "react"
import type { Vector3Tuple } from "three"
import { useDebugControls } from "@/debug/debugContext"
import useMultiballStore, { type MultiballBounceResult } from "@/stores/useMultiballStore"
import useScorePopupsStore from "@/stores/useScorePopupsStore"
import {
  BONUS_ZONE_SPAWN_INTERVAL_MS,
  MULTIBALL_SPAWN_POSITION1,
  MULTIBALL_SPAWN_POSITION2,
} from "./bonusZoneConfig"

interface BonusZoneHitOptions {
  bounceThreshold: number
  ballCount: number
}

interface BonusZoneHitPosition {
  x: number
  y: number
  z: number
}

const IGNORED_BONUS_HIT: MultiballBounceResult = { status: "ignored" }

export const registerBonusZoneHit = (
  ballId: string,
  { bounceThreshold, ballCount }: BonusZoneHitOptions,
  position?: BonusZoneHitPosition,
): MultiballBounceResult => {
  if (!ballId) return IGNORED_BONUS_HIT

  const pos1: Vector3Tuple = [...MULTIBALL_SPAWN_POSITION1]
  const pos2: Vector3Tuple = [...MULTIBALL_SPAWN_POSITION2]

  const result = useMultiballStore.getState().registerBounce({
    ballId,
    threshold: bounceThreshold,
    spawnPositions: [pos1, pos2],
    spawnIntervalMs: BONUS_ZONE_SPAWN_INTERVAL_MS,
    ballCount,
  })

  if (!position) return result

  if (result.status === "progress") {
    useScorePopupsStore.getState().spawnMultiballCountdownPopup(result.remaining, position)
  }
  if (result.status === "triggered") {
    useScorePopupsStore.getState().spawnMultiballTriggeredPopup(position)
  }

  return result
}

export const useBonusZoneHitRegistrar = () => {
  const { bounceThreshold, ballCount } = useDebugControls()

  return useCallback(
    (ballId: string, position?: BonusZoneHitPosition) => {
      registerBonusZoneHit(ballId, { bounceThreshold, ballCount }, position)
    },
    [bounceThreshold, ballCount],
  )
}
