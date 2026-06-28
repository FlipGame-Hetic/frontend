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

// One-way gate at the top of the lane, it marks a ball as in play once it reaches the table and then blocks it from rolling back into the lane
const PlungerLaneGate = () => {
  const setBallPlaying = useBallStore((state) => state.setBallPlaying)
  const playingBallsCount = useBallStore((state) => state.playingBallIds.length)

  const isGateActive = playingBallsCount > 0

  const handleSensorExit = useCallback(
    (payload: CollisionPayload) => {
      // Each ball carries its id in its Rapier userData, early return if the body is not a ball
      const ballId = getBallId(payload.other.rigidBodyObject?.userData)
      if (!ballId) return

      const ballPosition = payload.other.rigidBody?.translation()
      if (!ballPosition) return

      // If the ball has left the lane by crossing the gate, it is now playing
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
      {/* Gate sensor that checks whether the ball has crossed the gate on the right side */}
      <CuboidCollider
        sensor
        name="plunger-lane-gate-sensor"
        args={PLUNGER_LANE_GATE_HALF_EXTENTS}
        position={PLUNGER_LANE_GATE_POSITION}
        rotation={PLUNGER_LANE_GATE_ROTATION}
        onIntersectionExit={handleSensorExit}
      />

      {/* When a ball is in play, this collider renders to block the lane and prevent the ball from re-entering */}
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
