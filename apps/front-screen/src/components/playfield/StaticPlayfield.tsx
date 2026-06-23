import { useCallback, useMemo } from "react"
import type { CollisionPayload } from "@react-three/rapier"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { RAIL_COLLISION_GROUPS } from "../rails/railCollisionGroups"
import { getBallId } from "@/components/balls/runtime/ballUserData"
import { cloneAtWorldTransform, type PlayfieldNodes } from "./usePlayfieldModel"
import { enterRail, exitRailNow } from "../rails/railState"
import { RAIL_ENTRY_SENSORS, RAIL_EXIT_SENSORS, type RailSensorConfig } from "../rails/railConfig"
import { createBonusZoneHitTester } from "../bonusZone/bonusZoneHitTest"
import { BONUS_ZONE_RESTITUTION } from "../bonusZone/bonusZoneConfig"
import { useBonusZoneHitRegistrar } from "../bonusZone/bonusZoneHits"

const getBallIdFromPayload = ({ other }: CollisionPayload): string | undefined => {
  if (other.rigidBodyObject?.name !== "ball") return undefined
  return getBallId(other.rigidBodyObject.userData)
}

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

  const handleRailSensorEnter = useCallback(
    (sensor: RailSensorConfig, payload: CollisionPayload) => {
      const ballId = getBallIdFromPayload(payload)
      if (!ballId) return
      enterRail(ballId, sensor.source)
    },
    [],
  )

  const handleRailEndSensorEnter = useCallback((payload: CollisionPayload) => {
    const ballId = getBallIdFromPayload(payload)
    if (!ballId) return
    exitRailNow(ballId)
  }, [])

  const handleBonusZoneCollision = useCallback(
    ({ other }: CollisionPayload) => {
      if (other.rigidBodyObject?.name !== "ball") return
      const ballId = getBallId(other.rigidBodyObject.userData)
      if (!ballId) return
      const ballPosition = other.rigidBody?.translation()
      if (!ballPosition || !bonusZoneHitTester.containsPoint(ballPosition)) return

      registerBonusHit(ballId, { x: ballPosition.x, y: ballPosition.y, z: ballPosition.z })
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
        <RigidBody type="fixed" colliders="trimesh" collisionGroups={RAIL_COLLISION_GROUPS}>
          {clones.rails.map((mesh) => (
            <primitive key={mesh.uuid} object={mesh} />
          ))}
        </RigidBody>
      )}

      <RigidBody type="fixed" colliders={false}>
        {RAIL_ENTRY_SENSORS.map((sensor) => (
          <CuboidCollider
            key={sensor.id}
            sensor
            name={sensor.id}
            args={sensor.halfExtents}
            position={sensor.position}
            rotation={sensor.rotation}
            onIntersectionEnter={(payload) => {
              handleRailSensorEnter(sensor, payload)
            }}
          />
        ))}
        {RAIL_EXIT_SENSORS.map((sensor) => (
          <CuboidCollider
            key={sensor.id}
            sensor
            name={sensor.id}
            args={sensor.halfExtents}
            position={sensor.position}
            rotation={sensor.rotation}
            onIntersectionEnter={handleRailEndSensorEnter}
          />
        ))}
      </RigidBody>
    </>
  )
}

export default StaticPlayfield
