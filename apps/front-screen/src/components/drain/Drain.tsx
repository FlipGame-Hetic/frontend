import useGameStore from "@/stores/useGameStore"
import useBallStore from "@/stores/useBallStore"
import { playSfx } from "@/audio/soundEngine"
import { broadcastEvent } from "@frontend/ws"
import type { CollisionPayload } from "@react-three/rapier"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useControls } from "leva"
import { useCallback, useEffect, useRef } from "react"
import { hasBallId } from "@/components/balls/ballUserData"
import {
  DRAIN_RESPAWN_DELAY_MS,
  DRAIN_SENSOR_HALF_EXTENTS,
  DRAIN_SENSOR_POSITION,
} from "./drainConfig"

const Drain = () => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
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
      const { ballNumber, totalBalls, nextBall } = useGameStore.getState()

      const drainResult = useBallStore.getState().drainBall(ballId)
      if (!drainResult.wasTracked) return

      playSfx("ball_lost")

      if (!drainResult.isLifeLost) return

      broadcastEvent({ event_type: "BallLost", payload: {} })

      if (ballNumber >= totalBalls) {
        nextBall()
        return
      }

      timeoutRef.current = setTimeout(() => {
        useGameStore.getState().nextBall()
      }, respawnDelay)
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
