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
import type { Position3Type } from "@/types/worldTypes"

interface BonusZoneHitOptions {
  bounceThreshold: number
  ballCount: number
}

const IGNORED_BONUS_HIT: MultiballBounceResult = { status: "ignored" }

// Report a bounce to the multiball store and display the matching popup
export const registerBonusZoneHit = (
  ballId: string,
  { bounceThreshold, ballCount }: BonusZoneHitOptions,
  position?: Position3Type,
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

  // While the ball still has bounces to go, show how many are left before multiball
  if (result.status === "progress") {
    useScorePopupsStore.getState().spawnMultiballCountdownPopup(result.remaining, position)
  }
  // On the bounce that reaches the threshold, show the multiball triggered popup
  if (result.status === "triggered") {
    useScorePopupsStore.getState().spawnMultiballTriggeredPopup(position)
  }

  return result
}

// Hook that uses the threshold and ball cound from the Leva panel and updates the calllback accordingly
export const useBonusZoneHitRegistry = () => {
  const { bounceThreshold, ballCount } = useDebugControls()

  return useCallback(
    (ballId: string, position?: Position3Type) => {
      registerBonusZoneHit(ballId, { bounceThreshold, ballCount }, position)
    },
    [bounceThreshold, ballCount],
  )
}
