import type { RapierRigidBody } from "@react-three/rapier"
import { Vector3 } from "three"
import {
  TOP_TUNNEL_ASSIST_CENTER_DEAD_ZONE,
  TOP_TUNNEL_ASSIST_MAX_FORWARD_SPEED,
  TOP_TUNNEL_ASSIST_PULL_FULL_DISTANCE,
  type TopTunnelAssistCornerBlendConfig,
  type TopTunnelAssistSegmentConfig,
  type TopTunnelAssistSegmentId,
} from "./topTunnelAssistConfig"

export const ENTRY_ZONE_ID = "entry" as const
export type TopTunnelAssistZoneId = typeof ENTRY_ZONE_ID | TopTunnelAssistSegmentId

export interface RuntimeSegment {
  config: TopTunnelAssistSegmentConfig
  direction: Vector3
  end: Vector3
  index: number
  length: number
  start: Vector3
}

export interface RuntimeCornerBlend {
  afterDistance: number
  beforeDistance: number
  from: RuntimeSegment
  to: RuntimeSegment
}

export interface ActiveTopTunnelAssist {
  body: RapierRigidBody
  exitTimeout?: ReturnType<typeof setTimeout>
  lastSegmentIndex: number
  zones: Set<TopTunnelAssistZoneId>
}

export const clamp01 = (value: number): number => {
  return Math.min(Math.max(value, 0), 1)
}

export const smoothstep = (value: number): number => {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

export const createRuntimeSegment = (
  config: TopTunnelAssistSegmentConfig,
  index: number,
): RuntimeSegment => {
  const start = new Vector3(...config.start)
  const end = new Vector3(...config.end)
  const direction = end.clone().sub(start)
  const length = direction.length()

  if (length > 0) direction.divideScalar(length)

  return { config, direction, end, index, length, start }
}

export const createRuntimeCornerBlend = (
  config: TopTunnelAssistCornerBlendConfig,
  segments: RuntimeSegment[],
): RuntimeCornerBlend | null => {
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

export const distanceAlongSegment = (point: Vector3, segment: RuntimeSegment): number => {
  return point.clone().sub(segment.start).dot(segment.direction)
}

export const closestPointOnSegment = (point: Vector3, segment: RuntimeSegment): Vector3 => {
  if (segment.length <= 0) return segment.start.clone()

  const alongSegment = point.clone().sub(segment.start).dot(segment.direction)
  const clampedDistance = Math.min(Math.max(alongSegment, 0), segment.length)
  return segment.start.clone().addScaledVector(segment.direction, clampedDistance)
}

export const getCornerBlendWeight = (
  point: Vector3,
  activeSegment: RuntimeSegment,
  blends: RuntimeCornerBlend[],
): { blend: RuntimeCornerBlend; toWeight: number } | null => {
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

export const dotBodyVelocity = (body: RapierRigidBody, direction: Vector3): number => {
  const vel = body.linvel()
  return vel.x * direction.x + vel.y * direction.y + vel.z * direction.z
}

export const addCenterPullImpulse = (
  impulse: Vector3,
  point: Vector3,
  segment: RuntimeSegment,
  accel: number,
  weight: number,
  delta: number,
  mass: number,
): void => {
  if (weight <= 0.001) return

  const offset = closestPointOnSegment(point, segment).sub(point)
  const distance = offset.length()
  if (distance <= TOP_TUNNEL_ASSIST_CENTER_DEAD_ZONE) return

  const pullRatio = Math.min(distance / TOP_TUNNEL_ASSIST_PULL_FULL_DISTANCE, 1)
  impulse.addScaledVector(offset.divideScalar(distance), accel * weight * pullRatio * delta * mass)
}

export const addForwardImpulse = (
  impulse: Vector3,
  body: RapierRigidBody,
  direction: Vector3,
  accel: number,
  weight: number,
  delta: number,
  mass: number,
): void => {
  if (weight <= 0.001) return
  if (dotBodyVelocity(body, direction) >= TOP_TUNNEL_ASSIST_MAX_FORWARD_SPEED) return

  impulse.addScaledVector(direction, accel * weight * delta * mass)
}

export const getSegmentZoneIndex = (
  zone: TopTunnelAssistZoneId,
  segments: RuntimeSegment[],
): number => {
  return segments.findIndex((segment) => segment.config.id === zone)
}

export const getActiveSegment = (
  state: ActiveTopTunnelAssist,
  segments: RuntimeSegment[],
): RuntimeSegment | null => {
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
