import { CuboidCollider, RigidBody, type CollisionPayload } from "@react-three/rapier"
import { useCallback } from "react"
import type { Mesh } from "three"
import { getBallId } from "../balls/runtime/ballUserData"
import { RAIL_COLLISION_GROUPS } from "./railCollisionGroups"
import { RAIL_ENTRY_SENSORS, RAIL_EXIT_SENSORS, type RailSensorConfig } from "./railConfig"
import { enterRail, exitRailNow } from "./railState"

interface RailsManagerProps {
  nodes: Mesh[]
}

const RailsManager = ({ nodes }: RailsManagerProps) => {
  const getBallIdFromPayload = ({ other }: CollisionPayload): string | undefined => {
    if (other.rigidBodyObject?.name !== "ball") return undefined
    return getBallId(other.rigidBodyObject.userData)
  }

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

  return (
    <>
      {nodes.length > 0 && (
        // Rails get their own collision groups so the ball is guided along them by impulse, not by the rail mesh
        <RigidBody type="fixed" colliders="trimesh" collisionGroups={RAIL_COLLISION_GROUPS}>
          {nodes.map((mesh) => (
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

export default RailsManager
