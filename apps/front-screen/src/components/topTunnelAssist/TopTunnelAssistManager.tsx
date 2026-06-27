import useBallStore from "@/stores/useBallStore"
import { getBallId } from "@/components/balls/runtime/ballUserData"
import { useFrame } from "@react-three/fiber"
import type { CollisionPayload, RapierRigidBody } from "@react-three/rapier"
import { ConeCollider, CuboidCollider, RigidBody } from "@react-three/rapier"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { Vector3 } from "three"
import {
  TOP_TUNNEL_ASSIST_CORNER_BLENDS,
  TOP_TUNNEL_ASSIST_EXIT_DEBOUNCE_MS,
  TOP_TUNNEL_ASSIST_MIN_ENTRY_FORWARD_SPEED,
  TOP_TUNNEL_ASSIST_SEGMENTS,
  TOP_TUNNEL_ENTRY_TRACTOR,
} from "./topTunnelAssistConfig"
import TractorBeamSurface from "./TractorBeamSurface"
import {
  addCenterPullImpulse,
  addForwardImpulse,
  createRuntimeCornerBlend,
  createRuntimeSegment,
  dotBodyVelocity,
  ENTRY_ZONE_ID,
  getActiveSegment,
  getCornerBlendWeight,
  type ActiveTopTunnelAssist,
  type RuntimeCornerBlend,
  type TopTunnelAssistZoneId,
} from "./topTunnelAssistRuntime"
import { toVector3 } from "../physics/physicsConfig"

interface BallPayload {
  body: RapierRigidBody
  id: string
}

const extractBall = (payload: CollisionPayload): BallPayload | null => {
  const obj = payload.other.rigidBodyObject
  const body = payload.other.rigidBody
  if (obj?.name !== "ball" || !body) return null
  const ballId = getBallId(obj.userData)
  if (!ballId) return null
  return { body, id: ballId }
}

const TopTunnelAssistManager = () => {
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
      state.zones.add(segment.config.id as TopTunnelAssistZoneId)
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

      state.zones.delete(segment.config.id as TopTunnelAssistZoneId)
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
      const point = toVector3(position)
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
      <TractorBeamSurface />

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

export default TopTunnelAssistManager
