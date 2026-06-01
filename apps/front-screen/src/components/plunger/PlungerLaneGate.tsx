import useBallStore from "@/stores/useBallStore"
import type { CollisionPayload } from "@react-three/rapier"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useCallback } from "react"
import {
  isPastPlungerLaneGate,
  PLUNGER_LANE_GATE_HALF_EXTENTS,
  PLUNGER_LANE_GATE_NORMAL,
  PLUNGER_LANE_GATE_POSITION,
  PLUNGER_LANE_GATE_ROTATION,
} from "./plungerConfig"

const getBallId = (payload: CollisionPayload): string | null => {
  const obj = payload.other.rigidBodyObject
  if (!obj) return null
  const { ballId } = obj.userData as { ballId?: unknown }
  return typeof ballId === "string" ? ballId : null
}

const PlungerLaneGate = () => {
  const setBallPlaying = useBallStore((state) => state.setBallPlaying)
  const playingCount = useBallStore((state) => state.playingBallIds.length)
  const isGateActive = playingCount > 0

  const handleSensorExit = useCallback(
    (payload: CollisionPayload) => {
      const ballId = getBallId(payload)
      if (!ballId) return

      const ballPosition = payload.other.rigidBody?.translation()
      if (!ballPosition) return

      if (
        isPastPlungerLaneGate(ballPosition, PLUNGER_LANE_GATE_POSITION, PLUNGER_LANE_GATE_NORMAL)
      ) {
        setBallPlaying(ballId, true)
      }
    },
    [setBallPlaying],
  )

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider
        sensor
        name="plunger-lane-gate-sensor"
        args={PLUNGER_LANE_GATE_HALF_EXTENTS}
        position={PLUNGER_LANE_GATE_POSITION}
        rotation={PLUNGER_LANE_GATE_ROTATION}
        onIntersectionExit={handleSensorExit}
      />
      {isGateActive && (
        <CuboidCollider
          name="plunger-lane-gate"
          args={PLUNGER_LANE_GATE_HALF_EXTENTS}
          position={PLUNGER_LANE_GATE_POSITION}
          rotation={PLUNGER_LANE_GATE_ROTATION}
        />
      )}
    </RigidBody>
  )
}

export default PlungerLaneGate
