import { Fragment, useMemo, useRef } from "react"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import type { RapierRigidBody } from "@react-three/rapier"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import useBallStore from "@/stores/useBallStore"
import { hasBallId } from "@/utils/ballUserData"
import { BALL_RADIUS } from "../balls/ballConfig"
import {
  type RampSettings,
  type RampPathPoints,
  RAMP_CURVE_TENSION,
  RAMP_SENSOR_HEIGHT_PADDING,
  RAMP_SENSOR_MIN_HEIGHT_FACTOR,
  RAIL_RADIUS,
  RAIL_COLOR,
  RAIL_METALNESS,
  RAIL_ROUGHNESS,
  RAIL_TUBULAR_SEGMENTS,
  RAIL_RADIAL_SEGMENTS,
  RAIL_SAMPLE_POINTS,
} from "./rampConfig"

interface RampProps {
  points: RampPathPoints
  settings: RampSettings
}

interface RampSegment {
  id: number
  t: number
  centerPoint: THREE.Vector3
  tangent: THREE.Vector3
  normal: THREE.Vector3
  floorCenter: [number, number, number]
  leftWallCenter: [number, number, number]
  rightWallCenter: [number, number, number]
  quaternion: [number, number, number, number]
  floorScale: [number, number, number]
  wallScale: [number, number, number]
}

interface ActiveRampBall {
  body: RapierRigidBody
  overlapCount: number
  entrySpeedAlongRamp: number
}

const WORLD_UP = new THREE.Vector3(0, 1, 0)
const FALLBACK_SIDE = new THREE.Vector3(1, 0, 0)

function getSpeedAlongTangent(body: RapierRigidBody, tangent: THREE.Vector3) {
  const v = body.linvel()
  return v.x * tangent.x + v.y * tangent.y + v.z * tangent.z
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
      normal: normal.clone(),
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

interface RampRailCurves {
  bottom: THREE.CatmullRomCurve3
  left: THREE.CatmullRomCurve3
  right: THREE.CatmullRomCurve3
}

function buildRailCurves(curve: THREE.CatmullRomCurve3): RampRailCurves {
  const bottomPoints: THREE.Vector3[] = []
  const leftPoints: THREE.Vector3[] = []
  const rightPoints: THREE.Vector3[] = []
  const previousSide = FALLBACK_SIDE.clone()
  const railOffset = BALL_RADIUS + RAIL_RADIUS

  for (let i = 0; i <= RAIL_SAMPLE_POINTS; i++) {
    const t = i / RAIL_SAMPLE_POINTS
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t).normalize()

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

    bottomPoints.push(point.clone().addScaledVector(normal, -railOffset))
    leftPoints.push(point.clone().addScaledVector(side, railOffset))
    rightPoints.push(point.clone().addScaledVector(side, -railOffset))
  }

  return {
    bottom: new THREE.CatmullRomCurve3(bottomPoints, false, "catmullrom", RAMP_CURVE_TENSION),
    left: new THREE.CatmullRomCurve3(leftPoints, false, "catmullrom", RAMP_CURVE_TENSION),
    right: new THREE.CatmullRomCurve3(rightPoints, false, "catmullrom", RAMP_CURVE_TENSION),
  }
}

export default function Ramp({ points, settings }: RampProps) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points, false, "catmullrom", RAMP_CURVE_TENSION),
    [points],
  )
  const segments = useMemo(() => buildSegments(curve, settings), [curve, settings])
  const railCurves = useMemo(() => buildRailCurves(curve), [curve])
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

      const v = body.linvel()
      const n = closestSegment.normal
      const normalVel = v.x * n.x + v.y * n.y + v.z * n.z
      if (normalVel > settings.normalEscapeClamp) {
        const excess = normalVel - settings.normalEscapeClamp
        body.setLinvel(
          { x: v.x - excess * n.x, y: v.y - excess * n.y, z: v.z - excess * n.z },
          true,
        )
      }

      if (closestSegment.t > settings.assistMaxT) return
      if (closestSegment.tangent.y <= 0 && closestSegment.t < 0.75) return

      const speedAlongRamp = getSpeedAlongTangent(body, closestSegment.tangent)

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
      {(["bottom", "left", "right"] as const).map((key) => (
        <mesh key={`ramp-rail-${key}`}>
          <tubeGeometry
            args={[
              railCurves[key],
              RAIL_TUBULAR_SEGMENTS,
              RAIL_RADIUS,
              RAIL_RADIAL_SEGMENTS,
              false,
            ]}
          />
          <meshStandardMaterial
            color={RAIL_COLOR}
            metalness={RAIL_METALNESS}
            roughness={RAIL_ROUGHNESS}
          />
        </mesh>
      ))}

      <RigidBody type="fixed" colliders={false}>
        {segments.map((segment) => {
          const solidColliders = [
            { key: "floor", args: segment.floorScale, position: segment.floorCenter },
            { key: "left", args: segment.wallScale, position: segment.leftWallCenter },
            { key: "right", args: segment.wallScale, position: segment.rightWallCenter },
          ]

          return (
            <Fragment key={`ramp-collider-${String(segment.id)}`}>
              {solidColliders.map((c) => (
                <CuboidCollider
                  key={c.key}
                  args={[c.args[0] / 2, c.args[1] / 2, c.args[2] / 2]}
                  position={c.position}
                  quaternion={segment.quaternion}
                  friction={settings.surfaceFriction}
                  restitution={settings.surfaceRestitution}
                />
              ))}
              <CuboidCollider
                sensor
                args={[
                  segment.floorScale[0] / 2,
                  Math.max(
                    settings.wallHeight / 2 + BALL_RADIUS * RAMP_SENSOR_HEIGHT_PADDING,
                    BALL_RADIUS * RAMP_SENSOR_MIN_HEIGHT_FACTOR,
                  ),
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
          )
        })}
      </RigidBody>
    </group>
  )
}
