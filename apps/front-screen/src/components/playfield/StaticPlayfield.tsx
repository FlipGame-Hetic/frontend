import { useCallback, useMemo } from "react"
import type { CollisionPayload } from "@react-three/rapier"
import { RigidBody } from "@react-three/rapier"
import { useDebugControls } from "@/debug/debugContext"
import useMultiballStore from "@/stores/useMultiballStore"
import type { Vector3Tuple } from "three"
import { getBallId } from "@/components/balls/ballUserData"
import { cloneAtWorldTransform, type PlayfieldNodes } from "./usePlayfieldModel"
import { enterRail, scheduleExitRail } from "./railState"
import { createBonusZoneHitTester } from "./bonusZoneHitTest"
import {
  BONUS_ZONE_RESTITUTION,
  BONUS_ZONE_COOLDOWN_MS,
  BONUS_ZONE_SPAWN_INTERVAL_MS,
  MULTIBALL_SPAWN_POSITION1,
  MULTIBALL_SPAWN_POSITION2,
} from "./bonusZoneConfig"

const StaticPlayfield = ({ nodes }: { nodes: PlayfieldNodes }) => {
  const { bounceThreshold, ballCount } = useDebugControls()

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

      const pos1: Vector3Tuple = [...MULTIBALL_SPAWN_POSITION1]
      const pos2: Vector3Tuple = [...MULTIBALL_SPAWN_POSITION2]
      useMultiballStore
        .getState()
        .registerBounce(
          ballId,
          bounceThreshold,
          pos1,
          pos2,
          BONUS_ZONE_SPAWN_INTERVAL_MS,
          BONUS_ZONE_COOLDOWN_MS,
          ballCount,
        )
    },
    [bounceThreshold, ballCount, bonusZoneHitTester],
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
