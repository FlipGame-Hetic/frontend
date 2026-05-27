import { useCallback, useMemo } from "react"
import type { CollisionPayload } from "@react-three/rapier"
import { RigidBody } from "@react-three/rapier"
import { usePhysicsDebugControls } from "@/debug/physicsDebugContext"
import useMultiballStore from "@/stores/useMultiballStore"
import type { Vector3Tuple } from "three"
import { cloneAtWorldTransform, type PlayfieldNodes } from "./usePlayfieldModel"
import { enterRail, scheduleExitRail } from "./railState"
import { createBonusZoneHitTester } from "./bonusZoneHitTest"

export default function StaticPlayfield({ nodes }: { nodes: PlayfieldNodes }) {
  const { bonusZone: bonusZoneDebug } = usePhysicsDebugControls()

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
    const ballId = other.rigidBodyObject.userData.ballId as string | undefined
    if (!ballId) return
    enterRail(ballId)
  }, [])

  const handleRailExit = useCallback(({ other }: CollisionPayload) => {
    if (other.rigidBodyObject?.name !== "ball") return
    const ballId = other.rigidBodyObject.userData.ballId as string | undefined
    if (!ballId) return
    scheduleExitRail(ballId)
  }, [])

  const handleBonusZoneCollision = useCallback(
    ({ other }: CollisionPayload) => {
      if (other.rigidBodyObject?.name !== "ball") return
      const ballId = other.rigidBodyObject.userData.ballId as string | undefined
      if (!ballId) return
      const ballPosition = other.rigidBody?.translation()
      if (!ballPosition || !bonusZoneHitTester.containsPoint(ballPosition)) return

      const pos1: Vector3Tuple = [
        bonusZoneDebug.spawn1X,
        bonusZoneDebug.spawn1Y,
        bonusZoneDebug.spawn1Z,
      ]
      const pos2: Vector3Tuple = [
        bonusZoneDebug.spawn2X,
        bonusZoneDebug.spawn2Y,
        bonusZoneDebug.spawn2Z,
      ]
      useMultiballStore
        .getState()
        .registerBounce(
          ballId,
          bonusZoneDebug.bounceThreshold,
          pos1,
          pos2,
          bonusZoneDebug.spawnIntervalMs,
          bonusZoneDebug.cooldownMs,
          bonusZoneDebug.ballCount,
        )
    },
    [bonusZoneDebug, bonusZoneHitTester],
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
          restitution={bonusZoneDebug.restitution}
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
