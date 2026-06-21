import BallTrail from "./BallTrail"
import useBallStore from "@/stores/useBallStore"
import usePortalTraversalStore from "@/stores/usePortalTraversalStore"
import { isPointInPlungerLaneSensor } from "@/components/plunger/plungerConfig"
import type { PositionType } from "@/types/worldTypes"
import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { BallCollider, RigidBody, useAfterPhysicsStep, useRapier } from "@react-three/rapier"
import { useEffect, useRef } from "react"
import { DRAIN_SAFETY_FALLBACK_Y } from "../drain/drainConfig"
import { registerBallFade, unregisterBallFade } from "./ballFadeRegistry"
import { registerBallBody, unregisterBallBody } from "./ballBodyRegistry"
import { removeBallPosition, setBallPosition } from "./ballPositionRegistry"
import useBallMaterial from "./useBallMaterial"
import {
  clampVelocityToPlayfield,
  clampNormalToPlayfield,
  projectOnPlayfield,
  PLAYFIELD_DOWN,
  PLAYFIELD_UNIT_NORMAL,
} from "../physics/playfieldPlane"
import { isPointInSnapExemptZone } from "../physics/snapExemptZones"
import {
  BALL_COLLISION_GROUPS_WITH_RAILS,
  BALL_COLLISION_GROUPS_IGNORE_RAILS,
} from "../playfield/railCollisionGroups"
import { isOnRail, cleanupRailBall } from "../playfield/railState"
import {
  RAIL_BASE_ACCEL,
  RAIL_BOOST_PER_SECOND,
  RAIL_MAX_ACCEL,
  RAIL_MIN_VEL,
} from "../playfield/railConfig"
import { cleanupPortalBall } from "../portal/portalTraversalState"
import { BALL_RADIUS, BALL_SNAP_MAX_GAP, BALL_SNAP_EPSILON } from "./ballConfig"
import { TRAIL_MULTIBALL_POINTS, TRAIL_POINTS } from "./ballTrailConfig"

interface BallProps {
  id: string
  position: PositionType
  radius?: number
  mass: number
  restitution: number
  friction: number
  linearDamping: number
  angularDamping: number
  maxTangentSpeed: number
  laneMaxTangentSpeed: number
  minNormalSpeed: number
  maxNormalSpeed: number
  color?: string
}

const Ball = ({
  id,
  position,
  radius = BALL_RADIUS,
  mass,
  restitution,
  friction,
  linearDamping,
  angularDamping,
  maxTangentSpeed,
  laneMaxTangentSpeed,
  minNormalSpeed,
  maxNormalSpeed,
  color = "#FF8C00",
}: BallProps) => {
  const deleteBall = useBallStore((state) => state.deleteBall)
  const isMultiball = useBallStore((state) => state.playingBallIds.length > 1)
  const ballRef = useRef<RapierRigidBody>(null)
  const timeOnRailRef = useRef(0)
  const fadingRef = useRef(false)
  const drainedRef = useRef(false)

  const meshRef = useBallMaterial(color)
  const { rapier } = useRapier()

  useEffect(() => {
    registerBallFade(id, () => {
      fadingRef.current = true
      drainedRef.current = true
    })
    return () => {
      unregisterBallFade(id)
      unregisterBallBody(id)
      cleanupRailBall(id)
      cleanupPortalBall(id)
      usePortalTraversalStore.getState().removeGhost(id)
      removeBallPosition(id)
    }
  }, [id])

  useAfterPhysicsStep((world) => {
    const body = ballRef.current
    if (!body || fadingRef.current) return
    registerBallBody(id, body)

    const pos = body.translation()
    const vel = body.linvel()

    if (isOnRail(id) || isPointInSnapExemptZone(pos)) {
      body.setLinvel(clampNormalToPlayfield(vel, minNormalSpeed, maxNormalSpeed), true)
      return
    }

    const groundRay = new rapier.Ray({ x: pos.x, y: pos.y, z: pos.z }, PLAYFIELD_DOWN)

    const hit = world.castRay(
      groundRay,
      radius + BALL_SNAP_MAX_GAP,
      true,
      undefined,
      BALL_COLLISION_GROUPS_IGNORE_RAILS,
      undefined,
      body,
      (collider) => !collider.isSensor() && (collider.parent()?.isFixed() ?? false),
    )

    if (!hit) {
      body.setLinvel(clampNormalToPlayfield(vel, minNormalSpeed, maxNormalSpeed), true)
      return
    }

    const gap = hit.timeOfImpact - radius
    if (Math.abs(gap) > BALL_SNAP_EPSILON) {
      body.setTranslation(
        {
          x: pos.x - PLAYFIELD_UNIT_NORMAL.x * gap,
          y: pos.y - PLAYFIELD_UNIT_NORMAL.y * gap,
          z: pos.z - PLAYFIELD_UNIT_NORMAL.z * gap,
        },
        true,
      )
    }
    body.setLinvel(projectOnPlayfield(vel), true)
  })

  useFrame((_, delta) => {
    const body = ballRef.current
    if (!body) return

    const pos = body.translation()
    setBallPosition(id, { x: pos.x, y: pos.y, z: pos.z })

    if (pos.y <= DRAIN_SAFETY_FALLBACK_Y) {
      fadingRef.current = true
      return
    }

    const inLane = isPointInPlungerLaneSensor(pos)
    const vel = body.linvel()
    const clampedVelocity = clampVelocityToPlayfield(
      vel,
      inLane ? laneMaxTangentSpeed : maxTangentSpeed,
      minNormalSpeed,
      maxNormalSpeed,
    )
    body.setLinvel(clampedVelocity, true)

    if (isOnRail(id) && vel.z > RAIL_MIN_VEL) {
      timeOnRailRef.current += delta
      const accel = Math.min(
        RAIL_BASE_ACCEL + timeOnRailRef.current * RAIL_BOOST_PER_SECOND,
        RAIL_MAX_ACCEL,
      )
      body.applyImpulse({ x: 0, y: 0, z: accel * delta * mass }, true)
    } else {
      timeOnRailRef.current = 0
    }
  })

  return (
    <>
      <RigidBody
        ref={ballRef}
        type="dynamic"
        position={position}
        colliders={false}
        ccd
        name="ball"
        userData={{ ballId: id }}
        mass={mass}
        linearDamping={linearDamping}
        angularDamping={angularDamping}
      >
        <BallCollider
          args={[radius]}
          restitution={restitution}
          friction={friction}
          collisionGroups={BALL_COLLISION_GROUPS_WITH_RAILS}
        />
        <mesh ref={meshRef} castShadow>
          <sphereGeometry args={[radius, 24, 24]} />
        </mesh>
      </RigidBody>
      <BallTrail
        ballRef={ballRef}
        color={color}
        fadingRef={fadingRef}
        pointCount={isMultiball ? TRAIL_MULTIBALL_POINTS : TRAIL_POINTS}
        onFadeComplete={() => {
          if (!drainedRef.current) deleteBall(id)
        }}
      />
    </>
  )
}

export default Ball
