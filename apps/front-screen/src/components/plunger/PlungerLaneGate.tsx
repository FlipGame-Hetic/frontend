import { getBallId } from "@/components/balls/runtime/ballUserData"
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

const PlungerLaneGate = () => {
  const setBallPlaying = useBallStore((state) => state.setBallPlaying)
  const playingCount = useBallStore((state) => state.playingBallIds.length)
  const isGateActive = playingCount > 0

  const handleSensorExit = useCallback(
    (payload: CollisionPayload) => {
      const ballId = getBallId(payload.other.rigidBodyObject?.userData)
      if (!ballId) return

      const ballPosition = payload.other.rigidBody?.translation()
      if (!ballPosition) return

      // Ball left the sensor on the far side of the gate plane (onto the table), so mark it as playing
      if (
        isPastPlungerLaneGate(ballPosition, PLUNGER_LANE_GATE_POSITION, PLUNGER_LANE_GATE_NORMAL)
      ) {
        setBallPlaying(ballId)
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

      {/* Solid gate only exists while a ball is in play, so it blocks re-entry into the lane, otherwise the lane stays open */}
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
