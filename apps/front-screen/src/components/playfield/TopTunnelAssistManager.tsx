import useBallStore from "@/stores/useBallStore"
import { useFrame } from "@react-three/fiber"
import type { CollisionPayload, RapierRigidBody } from "@react-three/rapier"
import { ConeCollider, CuboidCollider, RigidBody } from "@react-three/rapier"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { Vector3 } from "three"
import {
  TOP_TUNNEL_ASSIST_CENTER_DEAD_ZONE,
  TOP_TUNNEL_ASSIST_CORNER_BLENDS,
  TOP_TUNNEL_ASSIST_EXIT_DEBOUNCE_MS,
  TOP_TUNNEL_ASSIST_MAX_FORWARD_SPEED,
  TOP_TUNNEL_ASSIST_MIN_ENTRY_FORWARD_SPEED,
  TOP_TUNNEL_ASSIST_PULL_FULL_DISTANCE,
  TOP_TUNNEL_ASSIST_SEGMENTS,
  TOP_TUNNEL_ENTRY_TRACTOR,
  type TopTunnelAssistCornerBlendConfig,
  type TopTunnelAssistSegmentConfig,
  type TopTunnelAssistSegmentId,
} from "./topTunnelAssistConfig"

const ENTRY_ZONE_ID = "entry"
type TopTunnelAssistZoneId = typeof ENTRY_ZONE_ID | TopTunnelAssistSegmentId

interface RuntimeSegment {
  config: TopTunnelAssistSegmentConfig
  direction: Vector3
  end: Vector3
  index: number
  length: number
  start: Vector3
}

interface RuntimeCornerBlend {
  afterDistance: number
  beforeDistance: number
  from: RuntimeSegment
  to: RuntimeSegment
}

interface ActiveTopTunnelAssist {
  body: RapierRigidBody
  exitTimeout?: ReturnType<typeof setTimeout>
  lastSegmentIndex: number
  zones: Set<TopTunnelAssistZoneId>
}

interface BallPayload {
  body: RapierRigidBody
  id: string
}

function extractBall(payload: CollisionPayload): BallPayload | null {
  const obj = payload.other.rigidBodyObject
  const body = payload.other.rigidBody
  if (obj?.name !== "ball" || !body) return null

  const ballId = obj.userData.ballId as string | undefined
  if (!ballId) return null
  return { body, id: ballId }
}

function dotBodyVelocity(body: RapierRigidBody, direction: Vector3): number {
  const vel = body.linvel()
  return vel.x * direction.x + vel.y * direction.y + vel.z * direction.z
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1)
}

function smoothstep(value: number): number {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

function createRuntimeSegment(config: TopTunnelAssistSegmentConfig, index: number): RuntimeSegment {
  const start = new Vector3(...config.start)
  const end = new Vector3(...config.end)
  const direction = end.clone().sub(start)
  const length = direction.length()

  if (length > 0) direction.divideScalar(length)

  return { config, direction, end, index, length, start }
}

function createRuntimeCornerBlend(
  config: TopTunnelAssistCornerBlendConfig,
  segments: RuntimeSegment[],
): RuntimeCornerBlend | null {
  const from = segments.find((segment) => segment.config.id === config.fromSegmentId)
  const to = segments.find((segment) => segment.config.id === config.toSegmentId)

  if (!from || !to) return null

  return {
    afterDistance: config.afterDistance,
    beforeDistance: config.beforeDistance,
    from,
    to,
  }
}

function distanceAlongSegment(point: Vector3, segment: RuntimeSegment): number {
  return point.clone().sub(segment.start).dot(segment.direction)
}

function closestPointOnSegment(point: Vector3, segment: RuntimeSegment): Vector3 {
  if (segment.length <= 0) return segment.start.clone()

  const alongSegment = point.clone().sub(segment.start).dot(segment.direction)
  const clampedDistance = Math.min(Math.max(alongSegment, 0), segment.length)
  return segment.start.clone().addScaledVector(segment.direction, clampedDistance)
}

function getCornerBlendWeight(
  point: Vector3,
  activeSegment: RuntimeSegment,
  blends: RuntimeCornerBlend[],
): { blend: RuntimeCornerBlend; toWeight: number } | null {
  for (const blend of blends) {
    let signedDistanceFromCorner: number | null = null

    if (activeSegment.index === blend.from.index) {
      const remainingDistance = blend.from.length - distanceAlongSegment(point, blend.from)
      if (remainingDistance > blend.beforeDistance) continue
      signedDistanceFromCorner = -remainingDistance
    } else if (activeSegment.index === blend.to.index) {
      const nextSegmentDistance = distanceAlongSegment(point, blend.to)
      if (nextSegmentDistance > blend.afterDistance) continue
      signedDistanceFromCorner = nextSegmentDistance
    }

    if (signedDistanceFromCorner === null) continue

    const transitionLength = blend.beforeDistance + blend.afterDistance
    const toWeight = smoothstep(
      (signedDistanceFromCorner + blend.beforeDistance) / transitionLength,
    )

    return { blend, toWeight }
  }

  return null
}

function addCenterPullImpulse(
  impulse: Vector3,
  point: Vector3,
  segment: RuntimeSegment,
  accel: number,
  weight: number,
  delta: number,
  mass: number,
): void {
  if (weight <= 0.001) return

  const offset = closestPointOnSegment(point, segment).sub(point)
  const distance = offset.length()
  if (distance <= TOP_TUNNEL_ASSIST_CENTER_DEAD_ZONE) return

  const pullRatio = Math.min(distance / TOP_TUNNEL_ASSIST_PULL_FULL_DISTANCE, 1)
  impulse.addScaledVector(offset.divideScalar(distance), accel * weight * pullRatio * delta * mass)
}

function addForwardImpulse(
  impulse: Vector3,
  body: RapierRigidBody,
  direction: Vector3,
  accel: number,
  weight: number,
  delta: number,
  mass: number,
): void {
  if (weight <= 0.001) return
  if (dotBodyVelocity(body, direction) >= TOP_TUNNEL_ASSIST_MAX_FORWARD_SPEED) return

  impulse.addScaledVector(direction, accel * weight * delta * mass)
}

function getSegmentZoneIndex(zone: TopTunnelAssistZoneId, segments: RuntimeSegment[]): number {
  return segments.findIndex((segment) => segment.config.id === zone)
}

function getActiveSegment(
  state: ActiveTopTunnelAssist,
  segments: RuntimeSegment[],
): RuntimeSegment | null {
  let bestIndex = -1

  for (const zone of state.zones) {
    if (zone === ENTRY_ZONE_ID) continue

    const index = getSegmentZoneIndex(zone, segments)
    if (index <= state.lastSegmentIndex) bestIndex = Math.max(bestIndex, index)
  }

  if (bestIndex < 0) {
    return state.lastSegmentIndex >= 0 ? (segments[state.lastSegmentIndex] ?? null) : null
  }

  return segments[bestIndex] ?? null
}

export default function TopTunnelAssistManager() {
  const activeBallsRef = useRef(new Map<string, ActiveTopTunnelAssist>())
  const runtimeSegments = useMemo(() => TOP_TUNNEL_ASSIST_SEGMENTS.map(createRuntimeSegment), [])
  const runtimeCornerBlends = useMemo(
    () =>
      TOP_TUNNEL_ASSIST_CORNER_BLENDS.map((config) =>
        createRuntimeCornerBlend(config, runtimeSegments),
      ).filter((blend): blend is RuntimeCornerBlend => blend !== null),
    [runtimeSegments],
  )

  const clearExitTimeout = useCallback((state: ActiveTopTunnelAssist) => {
    if (state.exitTimeout === undefined) return
    clearTimeout(state.exitTimeout)
    state.exitTimeout = undefined
  }, [])

  const scheduleCleanup = useCallback(
    (ballId: string, state: ActiveTopTunnelAssist) => {
      if (state.zones.size > 0) return

      clearExitTimeout(state)
      state.exitTimeout = setTimeout(() => {
        const current = activeBallsRef.current.get(ballId)
        if (!current || current.zones.size > 0) return
        activeBallsRef.current.delete(ballId)
      }, TOP_TUNNEL_ASSIST_EXIT_DEBOUNCE_MS)
    },
    [clearExitTimeout],
  )

  const ensureState = useCallback(
    (ballId: string, body: RapierRigidBody): ActiveTopTunnelAssist => {
      const existing = activeBallsRef.current.get(ballId)
      if (existing) {
        existing.body = body
        clearExitTimeout(existing)
        return existing
      }

      const nextState: ActiveTopTunnelAssist = {
        body,
        lastSegmentIndex: -1,
        zones: new Set(),
      }
      activeBallsRef.current.set(ballId, nextState)
      return nextState
    },
    [clearExitTimeout],
  )

  const canStartAssist = useCallback(
    (body: RapierRigidBody) => {
      const firstSegment = runtimeSegments[0]
      if (!firstSegment) return false

      return (
        dotBodyVelocity(body, firstSegment.direction) >= TOP_TUNNEL_ASSIST_MIN_ENTRY_FORWARD_SPEED
      )
    },
    [runtimeSegments],
  )

  const handleEntryEnter = useCallback(
    (payload: CollisionPayload) => {
      const ball = extractBall(payload)
      if (!ball || !canStartAssist(ball.body)) return

      const state = ensureState(ball.id, ball.body)
      state.zones.add(ENTRY_ZONE_ID)
    },
    [canStartAssist, ensureState],
  )

  const handleEntryExit = useCallback(
    (payload: CollisionPayload) => {
      const ball = extractBall(payload)
      if (!ball) return

      const state = activeBallsRef.current.get(ball.id)
      if (!state) return

      state.zones.delete(ENTRY_ZONE_ID)
      scheduleCleanup(ball.id, state)
    },
    [scheduleCleanup],
  )

  const handleSegmentEnter = useCallback(
    (segmentIndex: number, payload: CollisionPayload) => {
      const segment = runtimeSegments[segmentIndex]
      if (!segment) return

      const ball = extractBall(payload)
      if (!ball) return

      const existing = activeBallsRef.current.get(ball.id)
      if (!existing && (segmentIndex !== 0 || !canStartAssist(ball.body))) return

      const state = ensureState(ball.id, ball.body)
      if (segmentIndex > state.lastSegmentIndex + 1) return

      state.lastSegmentIndex = Math.max(state.lastSegmentIndex, segmentIndex)
      state.zones.add(segment.config.id)
    },
    [canStartAssist, ensureState, runtimeSegments],
  )

  const handleSegmentExit = useCallback(
    (segmentIndex: number, payload: CollisionPayload) => {
      const segment = runtimeSegments[segmentIndex]
      if (!segment) return

      const ball = extractBall(payload)
      if (!ball) return

      const state = activeBallsRef.current.get(ball.id)
      if (!state) return

      state.zones.delete(segment.config.id)
      scheduleCleanup(ball.id, state)
    },
    [runtimeSegments, scheduleCleanup],
  )

  useEffect(() => {
    const activeBalls = activeBallsRef.current

    return () => {
      for (const state of activeBalls.values()) clearExitTimeout(state)
      activeBalls.clear()
    }
  }, [clearExitTimeout])

  useFrame((_, delta) => {
    if (activeBallsRef.current.size === 0) return

    const trackedBallIds = new Set(useBallStore.getState().balls.map((ball) => ball.id))

    for (const [ballId, state] of activeBallsRef.current) {
      if (!trackedBallIds.has(ballId)) {
        clearExitTimeout(state)
        activeBallsRef.current.delete(ballId)
        continue
      }

      const position = state.body.translation()
      const point = new Vector3(position.x, position.y, position.z)
      const mass = state.body.mass()
      const impulse = new Vector3()
      const firstSegment = runtimeSegments[0]

      if (firstSegment && state.zones.has(ENTRY_ZONE_ID)) {
        addCenterPullImpulse(
          impulse,
          point,
          firstSegment,
          TOP_TUNNEL_ENTRY_TRACTOR.pullAccel,
          1,
          delta,
          mass,
        )
      }

      const activeSegment = getActiveSegment(state, runtimeSegments)
      if (activeSegment) {
        const cornerBlend = getCornerBlendWeight(point, activeSegment, runtimeCornerBlends)

        if (cornerBlend) {
          const fromWeight = 1 - cornerBlend.toWeight
          addCenterPullImpulse(
            impulse,
            point,
            cornerBlend.blend.from,
            cornerBlend.blend.from.config.centerPullAccel,
            fromWeight,
            delta,
            mass,
          )
          addCenterPullImpulse(
            impulse,
            point,
            cornerBlend.blend.to,
            cornerBlend.blend.to.config.centerPullAccel,
            cornerBlend.toWeight,
            delta,
            mass,
          )
          addForwardImpulse(
            impulse,
            state.body,
            cornerBlend.blend.from.direction,
            cornerBlend.blend.from.config.forwardAccel,
            fromWeight,
            delta,
            mass,
          )
          addForwardImpulse(
            impulse,
            state.body,
            cornerBlend.blend.to.direction,
            cornerBlend.blend.to.config.forwardAccel,
            cornerBlend.toWeight,
            delta,
            mass,
          )
        } else {
          addCenterPullImpulse(
            impulse,
            point,
            activeSegment,
            activeSegment.config.centerPullAccel,
            1,
            delta,
            mass,
          )
          addForwardImpulse(
            impulse,
            state.body,
            activeSegment.direction,
            activeSegment.config.forwardAccel,
            1,
            delta,
            mass,
          )
        }
      }

      if (impulse.lengthSq() > 0) {
        state.body.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true)
      }
    }
  })

  return (
    <RigidBody type="fixed" colliders={false}>
      <ConeCollider
        sensor
        name="top-tunnel-entry-tractor"
        args={[TOP_TUNNEL_ENTRY_TRACTOR.halfHeight, TOP_TUNNEL_ENTRY_TRACTOR.radius]}
        position={TOP_TUNNEL_ENTRY_TRACTOR.position}
        rotation={TOP_TUNNEL_ENTRY_TRACTOR.rotation}
        onIntersectionEnter={handleEntryEnter}
        onIntersectionExit={handleEntryExit}
      />

      {TOP_TUNNEL_ASSIST_SEGMENTS.map((segment, index) => (
        <CuboidCollider
          key={segment.id}
          sensor
          name={`top-tunnel-assist-${segment.id}`}
          args={segment.sensorHalfExtents}
          position={segment.sensorPosition}
          rotation={segment.sensorRotation}
          onIntersectionEnter={(payload) => {
            handleSegmentEnter(index, payload)
          }}
          onIntersectionExit={(payload) => {
            handleSegmentExit(index, payload)
          }}
        />
      ))}
    </RigidBody>
  )
}
