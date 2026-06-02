import { getBallId } from "@/components/balls/ballUserData"
import { useFrame } from "@react-three/fiber"
import { CuboidCollider, RigidBody, useRapier } from "@react-three/rapier"
import { useRef } from "react"
import {
  GROUND_RAIL_ZONE_HALF_EXTENTS,
  GROUND_RAIL_ZONE_POSITION,
  GROUND_RAIL_ZONE_ROTATION,
} from "./groundRailZoneConfig"
import { isPointInGroundRailZone } from "./groundRailZoneBounds"
import { setBallRailCollision } from "./railCollisionGroups"

const GroundRailZoneSensor = () => {
  const { rigidBodyStates } = useRapier()
  const wasInsideRef = useRef(new Map<string, boolean>())

  useFrame(() => {
    const wasInside = wasInsideRef.current
    const seenBallIds = new Set<string>()

    rigidBodyStates.forEach((state) => {
      if (state.object.name !== "ball") return
      const ballId = getBallId(state.object.userData)
      if (!ballId) return

      seenBallIds.add(ballId)
      const isInside = isPointInGroundRailZone(state.rigidBody.translation())
      const wasInZone = wasInside.get(ballId) ?? false

      if (isInside !== wasInZone) {
        setBallRailCollision(state.rigidBody, isInside)
        wasInside.set(ballId, isInside)
      }
    })

    for (const [ballId, inZone] of wasInside) {
      if (seenBallIds.has(ballId)) continue
      if (!inZone) {
        wasInside.delete(ballId)
        continue
      }
      wasInside.delete(ballId)
    }
  })

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider
        sensor
        args={GROUND_RAIL_ZONE_HALF_EXTENTS}
        position={GROUND_RAIL_ZONE_POSITION}
        rotation={GROUND_RAIL_ZONE_ROTATION}
      />
    </RigidBody>
  )
}

export default GroundRailZoneSensor
