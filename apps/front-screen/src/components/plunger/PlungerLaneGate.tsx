import useBallStore from "@/stores/useBallStore"
import { usePhysicsDebugControls } from "@/debug/physicsDebugContext"
import type { CollisionPayload } from "@react-three/rapier"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useCallback } from "react"
import { isPastPlungerLaneGate } from "./plungerConfig"

function getBallId(payload: CollisionPayload): string | null {
  const obj = payload.other.rigidBodyObject
  if (!obj) return null
  const { ballId } = obj.userData as { ballId?: unknown }
  return typeof ballId === "string" ? ballId : null
}

const PlungerLaneGate = () => {
  const setBallPlaying = useBallStore((state) => state.setBallPlaying)
  const playingCount = useBallStore((state) => state.playingBallIds.length)
  const { plungerGate } = usePhysicsDebugControls()
  const isGateActive = playingCount > 0

  const handleSensorExit = useCallback(
    (payload: CollisionPayload) => {
      const ballId = getBallId(payload)
      if (!ballId) return

      const ballPosition = payload.other.rigidBody?.translation()
      if (!ballPosition) return

      if (isPastPlungerLaneGate(ballPosition, plungerGate.position, plungerGate.normal)) {
        setBallPlaying(ballId, true)
      }
    },
    [setBallPlaying, plungerGate.position, plungerGate.normal],
  )

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider
        sensor
        name="plunger-lane-gate-sensor"
        args={plungerGate.halfExtents}
        position={plungerGate.position}
        rotation={plungerGate.rotation}
        onIntersectionExit={handleSensorExit}
      />
      {isGateActive && (
        <CuboidCollider
          name="plunger-lane-gate"
          args={plungerGate.halfExtents}
          position={plungerGate.position}
          rotation={plungerGate.rotation}
        />
      )}
    </RigidBody>
  )
}

export default PlungerLaneGate
