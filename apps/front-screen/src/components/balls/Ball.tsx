import BallTrail from "./trail/BallTrail"
import useBallStore from "@/stores/useBallStore"
import usePortalTraversalStore from "@/stores/usePortalTraversalStore"
import { isPointInPlungerLaneSensor } from "@/components/plunger/plungerConfig"
import type { PositionType } from "@/types/worldTypes"
import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { BallCollider, RigidBody, useAfterPhysicsStep, useRapier } from "@react-three/rapier"
import { useEffect, useRef } from "react"
import { DRAIN_SAFETY_FALLBACK_Y } from "../drain/drainConfig"
import { registerBallFade, unregisterBallFade } from "./runtime/ballFadeRegistry"
import { registerBallBody, unregisterBallBody } from "./runtime/ballBodyRegistry"
import { removeBallPosition, setBallPosition } from "./runtime/ballPositionRegistry"
import useBallMaterial from "./material/useBallMaterial"
import {
  clampVelocityToPlayfield,
  clampNormalToPlayfield,
  projectOnPlayfield,
  PLAYFIELD_DOWN,
  PLAYFIELD_UNIT_NORMAL,
} from "../physics/playfieldPlane"
import { isPointInSnapExemptZone } from "../physics/snap/snapExemptZones"
import {
  BALL_COLLISION_GROUPS_WITH_RAILS,
  BALL_COLLISION_GROUPS_IGNORE_RAILS,
} from "../rails/railCollisionGroups"
import { isOnRail, cleanupRailBall } from "../rails/railState"
import {
  RAIL_BASE_ACCEL,
  RAIL_BOOST_PER_SECOND,
  RAIL_MAX_ACCEL,
  RAIL_MIN_VEL,
} from "../rails/railConfig"
import { cleanupPortalBall } from "../portal/portalTraversalState"
import { BALL_RADIUS, BALL_SNAP_MAX_GAP, BALL_SNAP_EPSILON } from "./ballConfig"
import { TRAIL_MULTIBALL_POINTS, TRAIL_POINTS } from "./trail/ballTrailConfig"

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
    // Registered by the registry : once triggered by the drain, the ball stops being snapped/clamped and is treated as drained
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

  // After each physics step, snap the ball back onto the tilted playfield and strip any velocity that leaves the plane to prevent the ball from leaving the 'ground'
  useAfterPhysicsStep((world) => {
    const body = ballRef.current
    if (!body || fadingRef.current) return
    registerBallBody(id, body)

    const pos = body.translation()
    const vel = body.linvel()

    // On a rail or inside a snap-exempt zone (rails/tunnels entrances), skip the ground snap and only clamp how fast it leaves the plane
    if (isOnRail(id) || isPointInSnapExemptZone(pos)) {
      body.setLinvel(clampNormalToPlayfield(vel, minNormalSpeed, maxNormalSpeed), true)
      return
    }

    // Cast straight "down" the tilt to find the surface directly under the ball
    const groundRay = new rapier.Ray({ x: pos.x, y: pos.y, z: pos.z }, PLAYFIELD_DOWN)

    // Rails are excluded (IGNORE_RAILS group) so the ball doesn't try to rest on a rail collider as if it were ground
    const hit = world.castRay(
      // Ray
      groundRay,
      // maxToi
      radius + BALL_SNAP_MAX_GAP,
      // solid
      true,
      // filterFlags
      undefined,
      // filterGroups
      BALL_COLLISION_GROUPS_IGNORE_RAILS,
      // filterExcludeCollider
      undefined,
      // filterExcludeRigidBody
      body,
      // filterPredicate: Snap only against solid fixed geometry : skip sensors and dynamic bodies
      (collider) => !collider.isSensor() && (collider.parent()?.isFixed() ?? false),
    )

    if (!hit) {
      body.setLinvel(clampNormalToPlayfield(vel, minNormalSpeed, maxNormalSpeed), true)
      return
    }

    // Reposition along the normal so the ball rests exactly on the surface, closing any gap or penetration past epsilon
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
    // Publish position to the registry so off-React readers (score popups, portals) can place effects on this ball
    setBallPosition(id, { x: pos.x, y: pos.y, z: pos.z })

    // Safety net : if the ball tunneled past the drain sensor and fell below the table, fade it so it can't be lost forever
    if (pos.y <= DRAIN_SAFETY_FALLBACK_Y) {
      fadingRef.current = true
      return
    }

    // Every frame, cap the ball's in-plane speed (higher in the plunger lane to allow a strong launch) to prevent accumulated impulse from bumpers' bounce, and keep it pinned to the tilted plane
    const inPlungerLane = isPointInPlungerLaneSensor(pos)
    const vel = body.linvel()
    const clampedVelocity = clampVelocityToPlayfield(
      vel,
      inPlungerLane ? laneMaxTangentSpeed : maxTangentSpeed,
      minNormalSpeed,
      maxNormalSpeed,
    )
    body.setLinvel(clampedVelocity, true)

    // While riding a rail upward, ramp the boost the longer it stays on to fling it up, and reset the timer once it leaves
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
        // Disable colliders as a specific BallCollider is created below
        colliders={false}
        // ccd : continuous collision detection so a fast ball doesn't tunnel through thin colliders
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
          // Only delete here if the fade wasn't a drain (ball fell through the playfield), as a drained ball is already removed by the drain handler
          if (!drainedRef.current) deleteBall(id)
        }}
      />
    </>
  )
}

export default Ball
