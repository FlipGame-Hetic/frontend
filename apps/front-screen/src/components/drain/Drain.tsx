import useGameStore from "@/stores/useGameStore"
import useBallStore from "@/stores/useBallStore"
import { playRandomSfx } from "@/audio/soundEngine"
import { broadcastEvent } from "@frontend/ws"
import type { CollisionPayload } from "@react-three/rapier"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useControls } from "leva"
import { useCallback, useEffect, useRef } from "react"
import { hasBallId } from "@/components/balls/runtime/ballUserData"
import { triggerBallFade } from "@/components/balls/runtime/ballFadeRegistry"
import { TRAIL_FADE_DURATION } from "@/components/balls/trail/ballTrailConfig"
import {
  DRAIN_RESPAWN_DELAY_MS,
  DRAIN_SENSOR_HALF_EXTENTS,
  DRAIN_SENSOR_POSITION,
} from "./drainConfig"

const Drain = () => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const drainFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
      if (drainFadeTimeoutRef.current !== null) clearTimeout(drainFadeTimeoutRef.current)
    }
  }, [])

  const { respawnDelay } = useControls(
    "Drain",
    {
      respawnDelay: { value: DRAIN_RESPAWN_DELAY_MS, min: 0, max: 5000, step: 100 },
    },
    { collapsed: true },
  )

  const handleIntersectionEnter = useCallback(
    ({ other }: CollisionPayload) => {
      const obj = other.rigidBodyObject
      if (obj?.name !== "ball") return
      if (!hasBallId(obj.userData)) return

      const ballId = obj.userData.ballId

      triggerBallFade(ballId)

      // Wait for the trail fade to finish before committing the drain, so the ball visually disappears first
      drainFadeTimeoutRef.current = setTimeout(() => {
        const { isFinalBall, nextBall } = useGameStore.getState()
        const drainResult = useBallStore.getState().drainBall(ballId)
        // Duplicate sensor hit for an already-removed ball, nothing to drain
        if (!drainResult.wasTracked) return

        playRandomSfx("ball_lost")

        // Mid-multiball drain : this ball is gone but there all balls left, so no life is lost and we stop here
        if (!drainResult.isLifeLost) return

        broadcastEvent({ event_type: "BallLost", payload: {} })

        // If it was the finalBall, nextBall will end the game immediately, otherwise wait respawnDelay before serving the next ball
        if (isFinalBall()) {
          nextBall()
          return
        }

        timeoutRef.current = setTimeout(() => {
          useGameStore.getState().nextBall()
        }, respawnDelay)
      }, TRAIL_FADE_DURATION * 1000)
    },
    [respawnDelay],
  )

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider
        sensor
        name="drain"
        args={[
          DRAIN_SENSOR_HALF_EXTENTS[0],
          DRAIN_SENSOR_HALF_EXTENTS[1],
          DRAIN_SENSOR_HALF_EXTENTS[2],
        ]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[DRAIN_SENSOR_POSITION[0], DRAIN_SENSOR_POSITION[1], DRAIN_SENSOR_POSITION[2]]}
        onIntersectionEnter={handleIntersectionEnter}
      />
    </RigidBody>
  )
}

export default Drain
