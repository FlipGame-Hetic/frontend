import { useCallback, useEffect, useMemo, useRef } from "react"
import { CuboidCollider, RigidBody, useBeforePhysicsStep, useRapier } from "@react-three/rapier"
import type { RapierRigidBody } from "@react-three/rapier"
import * as THREE from "three"
import useBallStore from "@/stores/useBallStore"
import { TIME_STEP } from "../physics/physicsConfig"
import {
  RAMP_CHANNEL_RADIUS,
  RAMP_COLOR,
  RAMP_ENTRY_CAPTURE_BACKWARD,
  RAMP_ENTRY_CAPTURE_FORWARD,
  RAMP_ENTRY_CAPTURE_LATERAL,
  RAMP_ENTRY_CAPTURE_MAX_T,
  RAMP_MIN_DIRECTION_ALIGNMENT,
  RAMP_MIN_ENTRY_SPEED,
  RAMP_OPACITY,
  RAMP_RADIAL_SEGMENTS,
  type RampPathPoints,
  RAMP_SENSOR_ARGS,
  RAMP_SENSOR_OFFSET,
  RAMP_TUBE_SEGMENTS,
  REAL_GRAVITY_Y,
} from "./rampConfig"

interface RailRampProps {
  points: RampPathPoints
}

function hasBallId(value: unknown): value is { ballId: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "ballId" in value &&
    typeof value.ballId === "string"
  )
}

function toPlanar(vector: THREE.Vector3) {
  return new THREE.Vector3(vector.x, 0, vector.z)
}

function findClosestTInRange(
  curve: THREE.CatmullRomCurve3,
  position: THREE.Vector3,
  minT: number,
  maxT: number,
  samples = 12,
) {
  let closestT = minT
  let closestDistance = Infinity

  for (let i = 0; i <= samples; i++) {
    const alpha = i / samples
    const t = THREE.MathUtils.lerp(minT, maxT, alpha)
    const distance = curve.getPointAt(t).distanceToSquared(position)

    if (distance < closestDistance) {
      closestDistance = distance
      closestT = t
    }
  }

  return closestT
}

export default function RailRamp({ points }: RailRampProps) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5),
    [points],
  )
  const curveLength = useMemo(() => curve.getLength(), [curve])

  const tubeGeo = useMemo(
    () =>
      new THREE.TubeGeometry(
        curve,
        RAMP_TUBE_SEGMENTS,
        RAMP_CHANNEL_RADIUS,
        RAMP_RADIAL_SEGMENTS,
        false,
      ),
    [curve],
  )

  const activeBallRef = useRef<RapierRigidBody | null>(null)
  const activeBallIdRef = useRef<string | null>(null)
  const traversalRef = useRef({ t: 0, speed: 0 })

  const { rapier } = useRapier()
  const setBallRamping = useBallStore((state) => state.setBallRamping)

  const entryPoint = points[0]
  const entryTangent = useMemo(() => curve.getTangentAt(0), [curve])
  const entryDirection = useMemo(() => toPlanar(entryTangent).normalize(), [entryTangent])
  const sensorCenter = useMemo(
    () => entryPoint.clone().add(entryDirection.clone().multiplyScalar(-RAMP_SENSOR_OFFSET)),
    [entryDirection, entryPoint],
  )
  const sensorRotation = useMemo<[number, number, number]>(
    () => [0, Math.atan2(entryDirection.x, entryDirection.z), 0],
    [entryDirection],
  )

  const clearActiveBall = useCallback(() => {
    if (activeBallIdRef.current) {
      setBallRamping(activeBallIdRef.current, false)
    }

    activeBallRef.current = null
    activeBallIdRef.current = null
    traversalRef.current = { t: 0, speed: 0 }
  }, [setBallRamping])

  const releaseBall = useCallback(
    (body: RapierRigidBody, t: number, currentSpeed: number) => {
      const exitT = Math.max(0, Math.min(1, t))
      const exitPoint = curve.getPointAt(exitT)
      const exitDirection = curve.getTangentAt(exitT).multiplyScalar(t <= 0 ? -1 : 1)
      const exitVelocity = exitDirection.multiplyScalar(Math.abs(currentSpeed))

      body.setBodyType(rapier.RigidBodyType.Dynamic, true)
      body.setTranslation(exitPoint, true)
      body.setLinvel(exitVelocity, true)
      body.setAngvel({ x: 0, y: 0, z: 0 }, true)
      body.setGravityScale(1, true)
      body.wakeUp()

      clearActiveBall()
    },
    [clearActiveBall, curve, rapier],
  )

  useEffect(() => {
    return () => {
      const activeBody = activeBallRef.current
      if (activeBody?.isValid()) {
        releaseBall(activeBody, traversalRef.current.t, traversalRef.current.speed)
      }
    }
  }, [releaseBall])

  useBeforePhysicsStep(() => {
    const body = activeBallRef.current
    const ballId = activeBallIdRef.current

    if (!body || !ballId) return

    if (!body.isValid() || !useBallStore.getState().rampingBallIds.includes(ballId)) {
      clearActiveBall()
      return
    }

    const { t, speed } = traversalRef.current
    const safeT = Math.max(0.001, Math.min(0.999, t))
    const tangent = curve.getTangentAt(safeT)

    const gravityAcceleration = REAL_GRAVITY_Y * tangent.y
    const nextSpeed = speed + gravityAcceleration * TIME_STEP
    const nextT = t + (nextSpeed * TIME_STEP) / curveLength

    if (nextT >= 1) {
      releaseBall(body, 1, nextSpeed)
      return
    }

    if (nextT <= 0) {
      releaseBall(body, 0, nextSpeed)
      return
    }

    traversalRef.current = { t: nextT, speed: nextSpeed }
    body.setNextKinematicTranslation(curve.getPointAt(nextT))
  })

  return (
    <group>
      <mesh geometry={tubeGeo}>
        <meshPhysicalMaterial
          color={RAMP_COLOR}
          transparent
          opacity={RAMP_OPACITY}
          side={THREE.DoubleSide}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          sensor
          args={RAMP_SENSOR_ARGS}
          position={sensorCenter.toArray() as [number, number, number]}
          rotation={sensorRotation}
          onIntersectionEnter={({ other }) => {
            if (activeBallRef.current) return
            if (other.rigidBodyObject?.name !== "ball") return

            const body = other.rigidBody
            if (!body?.isValid()) return

            const rigidBodyObject = other.rigidBodyObject
            if (!hasBallId(rigidBodyObject.userData)) return

            const velocity = body.linvel()
            const velocityVector = new THREE.Vector3(velocity.x, velocity.y, velocity.z)
            const planarVelocity = toPlanar(velocityVector)
            const planarSpeed = planarVelocity.length()
            if (planarSpeed === 0) return

            const ballPosition = body.translation()
            const ballPositionVector = new THREE.Vector3(
              ballPosition.x,
              ballPosition.y,
              ballPosition.z,
            )
            const planarOffset = toPlanar(ballPositionVector.clone().sub(entryPoint))
            const forwardDistance = planarOffset.dot(entryDirection)
            const lateralOffset = planarOffset.sub(
              entryDirection.clone().multiplyScalar(forwardDistance),
            )

            if (forwardDistance < -RAMP_ENTRY_CAPTURE_BACKWARD) return
            if (forwardDistance > RAMP_ENTRY_CAPTURE_FORWARD) return
            if (lateralOffset.length() > RAMP_ENTRY_CAPTURE_LATERAL) return

            const alignment = planarVelocity.clone().normalize().dot(entryDirection)
            if (alignment < RAMP_MIN_DIRECTION_ALIGNMENT) return

            const captureT = findClosestTInRange(
              curve,
              ballPositionVector,
              0,
              RAMP_ENTRY_CAPTURE_MAX_T,
            )
            const capturePoint = curve.getPointAt(captureT)
            const captureDirection = toPlanar(curve.getTangentAt(captureT)).normalize()
            const entrySpeed = planarVelocity.dot(captureDirection)
            if (entrySpeed < RAMP_MIN_ENTRY_SPEED) return

            body.setLinvel({ x: 0, y: 0, z: 0 }, true)
            body.setAngvel({ x: 0, y: 0, z: 0 }, true)
            body.setGravityScale(0, true)
            body.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true)
            body.setTranslation(capturePoint, true)
            body.setNextKinematicTranslation(capturePoint)
            body.wakeUp()

            activeBallRef.current = body
            activeBallIdRef.current = rigidBodyObject.userData.ballId
            traversalRef.current = { t: captureT, speed: entrySpeed }
            setBallRamping(rigidBodyObject.userData.ballId, true)
          }}
        />
      </RigidBody>
    </group>
  )
}
