import { getBallId } from "@/components/balls/runtime/ballUserData"
import useBallStore from "@/stores/useBallStore"
import { useFrame } from "@react-three/fiber"
import type { CollisionPayload, RapierRigidBody } from "@react-three/rapier"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { Vector3 } from "three"
import type { DirectionalAccelerationSensorConfig } from "./directionalAccelerationSensorsConfig"
import { toVector3 } from "../physics/physicsConfig"

interface DirectionalAccelerationSensorsManagerProps {
  sensors: DirectionalAccelerationSensorConfig[]
}

interface ActiveBallState {
  body: RapierRigidBody
  sensorIds: Set<string>
}

interface RuntimeDirectionalSensor {
  config: DirectionalAccelerationSensorConfig
  direction: Vector3
}

const buildRuntimeSensor = (
  config: DirectionalAccelerationSensorConfig,
): RuntimeDirectionalSensor | null => {
  const direction = toVector3(config.direction)
  if (direction.lengthSq() <= 1e-6) return null
  direction.normalize()
  return { config, direction }
}

const DirectionalAccelerationSensorsManager = ({
  sensors,
}: DirectionalAccelerationSensorsManagerProps) => {
  const activeBallsRef = useRef(new Map<string, ActiveBallState>())

  const runtimeSensors = useMemo(
    () =>
      sensors
        .map(buildRuntimeSensor)
        .filter((sensor): sensor is RuntimeDirectionalSensor => !!sensor),
    [sensors],
  )

  const sensorById = useMemo(
    () => new Map(runtimeSensors.map((sensor) => [sensor.config.id, sensor])),
    [runtimeSensors],
  )

  const handleIntersectionEnter = useCallback((sensorId: string, payload: CollisionPayload) => {
    const obj = payload.other.rigidBodyObject
    const body = payload.other.rigidBody
    if (obj?.name !== "ball" || !body) return

    const ballId = getBallId(obj.userData)
    if (!ballId) return

    const current = activeBallsRef.current.get(ballId)
    if (current) {
      current.body = body
      current.sensorIds.add(sensorId)
      return
    }

    activeBallsRef.current.set(ballId, { body, sensorIds: new Set([sensorId]) })
  }, [])

  const handleIntersectionExit = useCallback((sensorId: string, payload: CollisionPayload) => {
    const obj = payload.other.rigidBodyObject
    if (obj?.name !== "ball") return

    const ballId = getBallId(obj.userData)
    if (!ballId) return

    const current = activeBallsRef.current.get(ballId)
    if (!current) return

    current.sensorIds.delete(sensorId)
    if (current.sensorIds.size === 0) {
      activeBallsRef.current.delete(ballId)
    }
  }, [])

  useEffect(() => {
    const activeBalls = activeBallsRef.current
    return () => {
      activeBalls.clear()
    }
  }, [])

  useFrame((_, delta) => {
    if (activeBallsRef.current.size === 0) return
    if (delta <= 0) return

    const trackedBallIds = new Set(useBallStore.getState().balls.map((ball) => ball.id))

    for (const [ballId, state] of activeBallsRef.current) {
      if (!trackedBallIds.has(ballId)) {
        activeBallsRef.current.delete(ballId)
        continue
      }

      if (state.sensorIds.size === 0) {
        activeBallsRef.current.delete(ballId)
        continue
      }

      const impulse = new Vector3()
      const velocity = state.body.linvel()
      const speed = Math.hypot(velocity.x, velocity.y, velocity.z)
      const mass = state.body.mass()

      for (const sensorId of state.sensorIds) {
        const sensor = sensorById.get(sensorId)
        if (!sensor) continue

        if (sensor.config.maxSpeed !== undefined && speed >= sensor.config.maxSpeed) continue
        impulse.addScaledVector(sensor.direction, sensor.config.acceleration * delta * mass)
      }

      if (impulse.lengthSq() > 0) {
        state.body.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true)
      }
    }
  })

  if (runtimeSensors.length === 0) return null

  return (
    <RigidBody type="fixed" colliders={false}>
      {runtimeSensors.map((sensor) => (
        <CuboidCollider
          key={sensor.config.id}
          sensor
          name={`directional-accel-${sensor.config.id}`}
          args={sensor.config.sensorHalfExtents}
          position={sensor.config.sensorPosition}
          rotation={sensor.config.sensorRotation}
          onIntersectionEnter={(payload) => {
            handleIntersectionEnter(sensor.config.id, payload)
          }}
          onIntersectionExit={(payload) => {
            handleIntersectionExit(sensor.config.id, payload)
          }}
        />
      ))}
    </RigidBody>
  )
}

export default DirectionalAccelerationSensorsManager
