import useGameStore from "@/stores/useGameStore"
import useBallStore from "@/stores/useBallStore"
import { broadcastEvent } from "@frontend/ws"
import type { CollisionPayload } from "@react-three/rapier"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useControls } from "leva"
import { useCallback, useEffect, useRef } from "react"
import {
  DRAIN_RESPAWN_DELAY_MS,
  DRAIN_SENSOR_HALF_EXTENTS,
  DRAIN_SENSOR_POSITION,
} from "./drainConfig"

function hasBallId(value: unknown): value is { ballId: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "ballId" in value &&
    typeof (value as Record<string, unknown>).ballId === "string"
  )
}

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
      const { ballNumber, currentPlayer } = useGameStore.getState()

      broadcastEvent({
        event_type: "ball_lost",
        payload: { ball: ballNumber, player: currentPlayer },
      })

      useBallStore.getState().deleteBall(ballId)

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
