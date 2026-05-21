import type { CollisionPayload } from "@react-three/rapier"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useFrame } from "@react-three/fiber"
import { folder, useControls } from "leva"
import { useCallback, useMemo, useRef } from "react"
import { Quaternion, Vector3, type Group, type Mesh } from "three"
import {
  SPINNER_DECAY_PER_SECOND,
  SPINNER_GATE_AXIS,
  SPINNER_MIN_SPEED,
  SPINNER_SENSOR_HALF_EXTENTS,
  SPINNER_SPEED_TO_ANGULAR,
  SPINNER_STOP_THRESHOLD,
} from "./spinnerConfig"

interface SpinnerProps {
  mesh: Mesh
  worldPosition: [number, number, number]
}

const Spinner = ({ mesh, worldPosition }: SpinnerProps) => {
  const spinnerRef = useRef<Group>(null)
  const angularVelRef = useRef(0)

  const { rawClone, worldQuat, worldScale } = useMemo(() => {
    mesh.updateWorldMatrix(true, false)
    const _p = new Vector3()
    const q = new Quaternion()
    const s = new Vector3()
    mesh.matrixWorld.decompose(_p, q, s)

    const rc = mesh.clone()
    rc.position.set(0, 0, 0)
    rc.quaternion.set(0, 0, 0, 1)
    rc.scale.set(1, 1, 1)

    return {
      rawClone: rc,
      worldQuat: q,
      worldScale: [s.x, s.y, s.z] as [number, number, number],
    }
  }, [mesh])

  const {
    speedToAngular,
    decayPerSecond,
    minSpeed,
    axisX,
    axisY,
    axisZ,
    sensorHalfX,
    sensorHalfY,
    sensorHalfZ,
  } = useControls("Spinner", {
    spinner: folder(
      {
        speedToAngular: { value: SPINNER_SPEED_TO_ANGULAR, min: 0, max: 20, step: 0.1 },
        decayPerSecond: { value: SPINNER_DECAY_PER_SECOND, min: 0.01, max: 0.99, step: 0.01 },
        minSpeed: { value: SPINNER_MIN_SPEED, min: 0, max: 10, step: 0.1 },
        axisX: { value: 1, min: -1, max: 1, step: 0.01 },
        axisY: { value: 0, min: -1, max: 1, step: 0.01 },
        axisZ: { value: 0, min: -1, max: 1, step: 0.01 },
        sensorHalfX: { value: SPINNER_SENSOR_HALF_EXTENTS[0], min: 0.1, max: 3, step: 0.05 },
        sensorHalfY: { value: SPINNER_SENSOR_HALF_EXTENTS[1], min: 0.1, max: 3, step: 0.05 },
        sensorHalfZ: { value: SPINNER_SENSOR_HALF_EXTENTS[2], min: 0.01, max: 1, step: 0.01 },
      },
      { collapsed: true },
    ),
  }) as {
    speedToAngular: number
    decayPerSecond: number
    minSpeed: number
    axisX: number
    axisY: number
    axisZ: number
    sensorHalfX: number
    sensorHalfY: number
    sensorHalfZ: number
  }

  const handleEnter = useCallback(
    ({ other }: CollisionPayload) => {
      if (other.rigidBodyObject?.name !== "ball") return
      const body = other.rigidBody
      if (!body) return
      const vel = body.linvel()
      const speed = Math.hypot(vel.x, vel.z)
      if (speed < minSpeed) return
      const dir = Math.sign(vel[SPINNER_GATE_AXIS])
      angularVelRef.current = speed * speedToAngular * dir
    },
    [minSpeed, speedToAngular],
  )

  const spinAxis = useMemo(
    () => new Vector3(axisX, axisY, axisZ).normalize(),
    [axisX, axisY, axisZ],
  )

  useFrame((_, delta) => {
    if (!spinnerRef.current) return
    spinnerRef.current.rotateOnAxis(spinAxis, angularVelRef.current * delta)
    angularVelRef.current *= Math.pow(decayPerSecond, delta)
    if (Math.abs(angularVelRef.current) < SPINNER_STOP_THRESHOLD) {
      angularVelRef.current = 0
    }
  })

  return (
    <>
      <group position={worldPosition} quaternion={worldQuat} scale={worldScale}>
        <group ref={spinnerRef}>
          <primitive object={rawClone} />
        </group>
      </group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          sensor
          name="spinner"
          args={[sensorHalfX, sensorHalfY, sensorHalfZ]}
          position={worldPosition}
          onIntersectionEnter={handleEnter}
        />
      </RigidBody>
    </>
  )
}

export default Spinner
