import { Fragment, useMemo, useRef } from "react"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import type { RapierRigidBody } from "@react-three/rapier"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import useBallStore from "@/stores/useBallStore"
import { BALL_RADIUS } from "../balls/ballConfig"
import { type RampSettings, RAMP_COLOR, RAMP_OPACITY, type RampPathPoints } from "./rampConfig"

interface RampProps {
  points: RampPathPoints
  settings: RampSettings
}

interface RampSegment {
  id: number
  t: number
  centerPoint: THREE.Vector3
  tangent: THREE.Vector3
  floorCenter: [number, number, number]
  leftWallCenter: [number, number, number]
  rightWallCenter: [number, number, number]
  quaternion: [number, number, number, number]
  floorScale: [number, number, number]
  wallScale: [number, number, number]
}

const WORLD_UP = new THREE.Vector3(0, 1, 0)
const FALLBACK_SIDE = new THREE.Vector3(1, 0, 0)

interface ActiveRampBall {
  body: RapierRigidBody
  overlapCount: number
  entrySpeedAlongRamp: number
}

function hasBallId(value: unknown): value is { ballId: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "ballId" in value &&
    typeof value.ballId === "string"
  )
}

function buildSegments(curve: THREE.CatmullRomCurve3, settings: RampSettings): RampSegment[] {
  const segments: RampSegment[] = []
  const previousSide = FALLBACK_SIDE.clone()

  for (let index = 0; index < settings.segmentCount; index++) {
    const startT = index / settings.segmentCount
    const endT = (index + 1) / settings.segmentCount
    const middleT = (startT + endT) / 2

    const startPoint = curve.getPointAt(startT)
    const endPoint = curve.getPointAt(endT)
    const centerPoint = curve.getPointAt(middleT)
    const tangent = curve.getTangentAt(middleT).normalize()

    const side = new THREE.Vector3().crossVectors(tangent, WORLD_UP)
    if (side.lengthSq() < 1e-5) {
      side.copy(previousSide)
    } else {
      side.normalize()
      if (side.dot(previousSide) < 0) {
        side.multiplyScalar(-1)
      }
      previousSide.copy(side)
    }

    const normal = new THREE.Vector3().crossVectors(side, tangent).normalize()
    const segmentLength = startPoint.distanceTo(endPoint) + settings.segmentOverlap
    const halfChannelWidth = settings.channelWidth / 2
    const floorCenter = centerPoint
      .clone()
      .addScaledVector(normal, -(BALL_RADIUS + settings.floorThickness / 2))
    const wallHeightOffset = settings.wallHeight / 2 - BALL_RADIUS
    const leftWallCenter = centerPoint
      .clone()
      .addScaledVector(side, halfChannelWidth + settings.wallThickness / 2)
      .addScaledVector(normal, wallHeightOffset)
    const rightWallCenter = centerPoint
      .clone()
      .addScaledVector(side, -(halfChannelWidth + settings.wallThickness / 2))
      .addScaledVector(normal, wallHeightOffset)

    const basis = new THREE.Matrix4().makeBasis(tangent, normal, side)
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(basis)

    segments.push({
      id: index,
      t: middleT,
      centerPoint: centerPoint.clone(),
      tangent: tangent.clone(),
      floorCenter: floorCenter.toArray() as [number, number, number],
      leftWallCenter: leftWallCenter.toArray() as [number, number, number],
      rightWallCenter: rightWallCenter.toArray() as [number, number, number],
      quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
      floorScale: [
        segmentLength,
        settings.floorThickness,
        settings.channelWidth + settings.wallThickness * 2,
      ],
      wallScale: [segmentLength, settings.wallHeight, settings.wallThickness],
    })
  }

  return segments
}

export default function Ramp({ points, settings }: RampProps) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5),
    [points],
  )
  const segments = useMemo(() => buildSegments(curve, settings), [curve, settings])
  const activeBallsRef = useRef<Map<string, ActiveRampBall>>(new Map())
  const setBallRamping = useBallStore((state) => state.setBallRamping)

  useFrame((_, delta) => {
    const firstSegment = segments[0]
    if (!firstSegment) return

    activeBallsRef.current.forEach((activeBall, ballId) => {
      const body = activeBall.body
      if (!body.isValid()) {
        activeBallsRef.current.delete(ballId)
        return
      }

      const translation = body.translation()
      const position = new THREE.Vector3(translation.x, translation.y, translation.z)
      let closestSegment = firstSegment
      let closestDistance = Infinity

      for (const segment of segments) {
        const distance = segment.centerPoint.distanceToSquared(position)
        if (distance < closestDistance) {
          closestDistance = distance
          closestSegment = segment
        }
      }

      if (closestSegment.t > settings.assistMaxT) return
      if (closestSegment.tangent.y <= 0) return

      const linearVelocity = body.linvel()
      const speedAlongRamp =
        linearVelocity.x * closestSegment.tangent.x +
        linearVelocity.y * closestSegment.tangent.y +
        linearVelocity.z * closestSegment.tangent.z

      const assistFade = 1 - THREE.MathUtils.smoothstep(closestSegment.t, 0, settings.assistMaxT)
      const retainedEntrySpeed = Math.min(
        activeBall.entrySpeedAlongRamp * settings.assistEntryRetention,
        settings.assistMaxSpeed,
      )
      const targetSpeed = retainedEntrySpeed * assistFade

      if (targetSpeed <= 0) return
      if (speedAlongRamp >= targetSpeed) return

      const speedDelta = targetSpeed - Math.max(speedAlongRamp, 0)
      const maxAcceleration = settings.assistAcceleration * assistFade
      const appliedAcceleration = Math.min(maxAcceleration, speedDelta / Math.max(delta, 1e-4))
      const impulseMagnitude = body.mass() * appliedAcceleration * delta
      const impulse = closestSegment.tangent.clone().multiplyScalar(impulseMagnitude)

      body.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true)
    })
  })

  function getSpeedAlongTangent(body: RapierRigidBody, tangent: THREE.Vector3) {
    const linearVelocity = body.linvel()
    return (
      linearVelocity.x * tangent.x + linearVelocity.y * tangent.y + linearVelocity.z * tangent.z
    )
  }

  function registerActiveBall(
    segment: RampSegment,
    rigidBodyObject: THREE.Object3D | undefined,
    body: RapierRigidBody | null | undefined,
  ) {
    if (!body?.isValid() || !rigidBodyObject || !hasBallId(rigidBodyObject.userData)) return

    const ballId = rigidBodyObject.userData.ballId
    const existing = activeBallsRef.current.get(ballId)
    const entrySpeedAlongRamp = Math.max(getSpeedAlongTangent(body, segment.tangent), 0)

    if (existing) {
      existing.body = body
      existing.overlapCount += 1
      existing.entrySpeedAlongRamp = Math.max(existing.entrySpeedAlongRamp, entrySpeedAlongRamp)
      return
    }

    activeBallsRef.current.set(ballId, {
      body,
      overlapCount: 1,
      entrySpeedAlongRamp,
    })
    setBallRamping(ballId, true)
  }

  function unregisterActiveBall(rigidBodyObject: THREE.Object3D | undefined) {
    if (!rigidBodyObject || !hasBallId(rigidBodyObject.userData)) return

    const ballId = rigidBodyObject.userData.ballId
    const existing = activeBallsRef.current.get(ballId)
    if (!existing) return

    if (existing.overlapCount <= 1) {
      activeBallsRef.current.delete(ballId)
      setBallRamping(ballId, false)
      return
    }

    existing.overlapCount -= 1
  }

  return (
    <group>
      {segments.map((segment) => (
        <Fragment key={`ramp-visual-${String(segment.id)}`}>
          <mesh
            position={segment.floorCenter}
            quaternion={segment.quaternion}
            scale={segment.floorScale}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshPhysicalMaterial
              color={RAMP_COLOR}
              transparent
              opacity={RAMP_OPACITY}
              roughness={0.15}
              metalness={0.1}
            />
          </mesh>
          <mesh
            position={segment.leftWallCenter}
            quaternion={segment.quaternion}
            scale={segment.wallScale}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshPhysicalMaterial
              color={RAMP_COLOR}
              transparent
              opacity={RAMP_OPACITY}
              roughness={0.2}
              metalness={0.05}
            />
          </mesh>
          <mesh
            position={segment.rightWallCenter}
            quaternion={segment.quaternion}
            scale={segment.wallScale}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshPhysicalMaterial
              color={RAMP_COLOR}
              transparent
              opacity={RAMP_OPACITY}
              roughness={0.2}
              metalness={0.05}
            />
          </mesh>
        </Fragment>
      ))}

      <RigidBody type="fixed" colliders={false}>
        {segments.map((segment) => (
          <Fragment key={`ramp-collider-${String(segment.id)}`}>
            <CuboidCollider
              args={[
                segment.floorScale[0] / 2,
                segment.floorScale[1] / 2,
                segment.floorScale[2] / 2,
              ]}
              position={segment.floorCenter}
              quaternion={segment.quaternion}
              friction={settings.surfaceFriction}
              restitution={settings.surfaceRestitution}
            />
            <CuboidCollider
              args={[segment.wallScale[0] / 2, segment.wallScale[1] / 2, segment.wallScale[2] / 2]}
              position={segment.leftWallCenter}
              quaternion={segment.quaternion}
              friction={settings.surfaceFriction}
              restitution={settings.surfaceRestitution}
            />
            <CuboidCollider
              args={[segment.wallScale[0] / 2, segment.wallScale[1] / 2, segment.wallScale[2] / 2]}
              position={segment.rightWallCenter}
              quaternion={segment.quaternion}
              friction={settings.surfaceFriction}
              restitution={settings.surfaceRestitution}
            />
            <CuboidCollider
              sensor
              args={[
                segment.floorScale[0] / 2,
                Math.max(settings.wallHeight / 2 + BALL_RADIUS * 0.5, BALL_RADIUS * 1.25),
                settings.channelWidth / 2,
              ]}
              position={segment.centerPoint.toArray() as [number, number, number]}
              quaternion={segment.quaternion}
              onIntersectionEnter={({ other }) => {
                if (other.rigidBodyObject?.name !== "ball") return
                registerActiveBall(segment, other.rigidBodyObject, other.rigidBody)
              }}
              onIntersectionExit={({ other }) => {
                if (other.rigidBodyObject?.name !== "ball") return
                unregisterActiveBall(other.rigidBodyObject)
              }}
            />
          </Fragment>
        ))}
      </RigidBody>
    </group>
  )
}
