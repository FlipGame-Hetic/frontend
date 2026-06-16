import { useCallback, useMemo } from "react"
import type { CollisionPayload } from "@react-three/rapier"
import { RigidBody } from "@react-three/rapier"
import { RAIL_COLLISION_GROUPS } from "./railCollisionGroups"
import { getBallId } from "@/components/balls/ballUserData"
import { cloneAtWorldTransform, type PlayfieldNodes } from "./usePlayfieldModel"
import { enterRail, scheduleExitRail } from "./railState"
import { createBonusZoneHitTester } from "./bonusZoneHitTest"
import { BONUS_ZONE_RESTITUTION } from "./bonusZoneConfig"
import { useBonusZoneHitRegistrar } from "./bonusZoneHits"

const StaticPlayfield = ({ nodes }: { nodes: PlayfieldNodes }) => {
  const registerBonusHit = useBonusZoneHitRegistrar()

  const clones = useMemo(
    () => ({
      solid: [...nodes.cabinet, ...nodes.playfield, ...nodes.overhead].map(cloneAtWorldTransform),
      bonusZone: nodes.bonusZone.map(cloneAtWorldTransform),
      sensors: nodes.lockedBall.map(cloneAtWorldTransform),
      rails: nodes.rails.map(cloneAtWorldTransform),
    }),
    [nodes],
  )
  const bonusZoneHitTester = useMemo(
    () => createBonusZoneHitTester(clones.bonusZone),
    [clones.bonusZone],
  )

  const handleRailEnter = useCallback(({ other }: CollisionPayload) => {
    if (other.rigidBodyObject?.name !== "ball") return
    const ballId = getBallId(other.rigidBodyObject.userData)
    if (!ballId) return
    enterRail(ballId)
  }, [])

  const handleRailExit = useCallback(({ other }: CollisionPayload) => {
    if (other.rigidBodyObject?.name !== "ball") return
    const ballId = getBallId(other.rigidBodyObject.userData)
    if (!ballId) return
    scheduleExitRail(ballId)
  }, [])

  const handleBonusZoneCollision = useCallback(
    ({ other }: CollisionPayload) => {
      if (other.rigidBodyObject?.name !== "ball") return
      const ballId = getBallId(other.rigidBodyObject.userData)
      if (!ballId) return
      const ballPosition = other.rigidBody?.translation()
      if (!ballPosition || !bonusZoneHitTester.containsPoint(ballPosition)) return

      registerBonusHit(ballId)
    },
    [bonusZoneHitTester, registerBonusHit],
  )

  return (
    <>
      <RigidBody type="fixed" colliders="trimesh">
        {clones.solid.map((mesh) => (
          <primitive key={mesh.uuid} object={mesh} />
        ))}
      </RigidBody>

      {clones.bonusZone.length > 0 && (
        <RigidBody
          type="fixed"
          colliders="trimesh"
          restitution={BONUS_ZONE_RESTITUTION}
          onCollisionEnter={handleBonusZoneCollision}
        >
          {clones.bonusZone.map((mesh) => (
            <primitive key={mesh.uuid} object={mesh} />
          ))}
        </RigidBody>
      )}

      {clones.sensors.length > 0 && (
        <RigidBody type="fixed" colliders="trimesh" sensor>
          {clones.sensors.map((mesh) => (
            <primitive key={mesh.uuid} object={mesh} />
          ))}
        </RigidBody>
      )}

      {clones.rails.length > 0 && (
        <RigidBody
          type="fixed"
          colliders="trimesh"
          collisionGroups={RAIL_COLLISION_GROUPS}
          onCollisionEnter={handleRailEnter}
          onCollisionExit={handleRailExit}
        >
          {clones.rails.map((mesh) => (
            <primitive key={mesh.uuid} object={mesh} />
          ))}
        </RigidBody>
      )}
    </>
  )
}

export default StaticPlayfield
