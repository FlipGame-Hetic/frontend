import { RigidBody, type CollisionPayload } from "@react-three/rapier"
import { useCallback, useMemo } from "react"
import type { Mesh } from "three"
import { getBallId } from "../balls/runtime/ballUserData"
import { BONUS_ZONE_RESTITUTION } from "./bonusZoneConfig"
import { useBonusZoneHitRegistry } from "./bonusZoneHits"
import { createBonusZoneHitTester } from "./bonusZoneHitTest"

interface BonusZoneProps {
  nodes: Mesh[]
}

const BonusZone = ({ nodes }: BonusZoneProps) => {
  const registerBonusHit = useBonusZoneHitRegistry()

  const bonusZoneHitTester = useMemo(() => createBonusZoneHitTester(nodes), [nodes])

  const handleBonusZoneCollision = useCallback(
    ({ other }: CollisionPayload) => {
      if (other.rigidBodyObject?.name !== "ball") return
      const ballId = getBallId(other.rigidBodyObject.userData)
      if (!ballId) return
      const ballPosition = other.rigidBody?.translation()
      // Check whether the collision was inside of the bonus zone before registering
      if (!ballPosition || !bonusZoneHitTester.containsPoint(ballPosition)) return

      registerBonusHit(ballId, { x: ballPosition.x, y: ballPosition.y, z: ballPosition.z })
    },
    [bonusZoneHitTester, registerBonusHit],
  )

  return (
    <>
      {nodes.length > 0 && (
        <RigidBody
          type="fixed"
          colliders="trimesh"
          restitution={BONUS_ZONE_RESTITUTION}
          onCollisionEnter={handleBonusZoneCollision}
        >
          {nodes.map((mesh) => (
            <primitive key={mesh.uuid} object={mesh} />
          ))}
        </RigidBody>
      )}
    </>
  )
}

export default BonusZone
