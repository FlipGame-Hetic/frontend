import { isPointInPlungerLaneSensor } from "@/components/plunger/plungerConfig"
import useBallStore from "@/stores/useBallStore"
import useGameStore from "@/stores/useGameStore"
import usePortalTraversalStore from "@/stores/usePortalTraversalStore"
import type { PositionType } from "@/types/worldTypes"
import { GAME_PHASE } from "@frontend/types"
import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { BallCollider, RigidBody, useAfterPhysicsStep, useRapier } from "@react-three/rapier"
import { useEffect, useRef } from "react"
import type { Vector3Like } from "three"
import { MULTIBALL_SPAWN_POSITION1, MULTIBALL_SPAWN_POSITION2 } from "../bonusZone/bonusZoneConfig"
import { commitBallDrain } from "../drain/drainCommit"
import { DRAIN_RESPAWN_DELAY_MS, DRAIN_SAFETY_FALLBACK_Y } from "../drain/drainConfig"
import { forgetFlipperContact, isBallOnFlipper } from "../flippers/flipperContact"
import {
  createStuckBallWatchdog,
  type StuckBallWatchdog,
} from "../physics/collision/stuckBallWatchdog"
import { isPointInSnapExemptZone } from "../physics/snap/snapExemptZones"
import {
  clampNormalToPlayfield,
  clampVelocityToPlayfield,
  PLAYFIELD_DOWN,
  PLAYFIELD_UNIT_NORMAL,
  projectOnPlayfield,
} from "../playfield/playfieldConfig"
import { cleanupPortalBall } from "../portal/portalTraversalState"
import {
  BALL_COLLISION_GROUPS_IGNORE_RAILS,
  BALL_COLLISION_GROUPS_WITH_RAILS,
} from "../rails/railCollisionGroups"
import {
  RAIL_BASE_ACCEL,
  RAIL_BOOST_PER_SECOND,
  RAIL_MAX_ACCEL,
  RAIL_MIN_VEL,
} from "../rails/railConfig"
import { cleanupRailBall, isOnRail } from "../rails/railState"
import {
  BALL_RADIUS,
  BALL_REST_CONTACT_DISTANCE,
  BALL_SNAP_EPSILON,
  BALL_SNAP_MAX_GAP,
  BALL_STUCK_FRAMES_BEFORE_ATTEMPT,
  BALL_STUCK_MAX_IMPULSE_ATTEMPTS,
  BALL_STUCK_OBSERVE_FRAMES,
  BALL_STUCK_RESTUCK_FRAMES,
  BALL_STUCK_VELOCITY,
  BALL_UNSTICK_IMPULSE,
} from "./ballConfig"
import useBallMaterial from "./material/useBallMaterial"
import { registerBallBody, unregisterBallBody } from "./runtime/ballBodyRegistry"
import { registerBallFade, unregisterBallFade } from "./runtime/ballFadeRegistry"
import {
  getBallPositionEntries,
  removeBallPosition,
  setBallPosition,
} from "./runtime/ballPositionRegistry"
import {
  forgetBallContagion,
  isRestingByContagion,
  setBallAtRest,
} from "./runtime/ballRestContagion"
import BallTrail from "./trail/BallTrail"
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

// Nudge a wedged ball with a fixed 2D impulse so it can never be pushed up off the ground
const applyUnstickImpulse = (body: RapierRigidBody, dir: Vector3Like) => {
  body.applyImpulse(
    {
      x: dir.x * BALL_UNSTICK_IMPULSE,
      y: dir.y * BALL_UNSTICK_IMPULSE,
      z: dir.z * BALL_UNSTICK_IMPULSE,
    },
    true,
  )
}

// Last resort : drop the ball at a random portal mouth (reuses the multiball spawn points, stays in play) and kill its velocity
const teleportToRandomPortal = (body: RapierRigidBody) => {
  const [x, y, z] = Math.random() < 0.5 ? MULTIBALL_SPAWN_POSITION1 : MULTIBALL_SPAWN_POSITION2
  body.setTranslation({ x, y, z }, true)
  body.setLinvel({ x: 0, y: 0, z: 0 }, true)
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
  const isMultiball = useBallStore((state) => state.playingBallIds.length > 1)
  const ballRef = useRef<RapierRigidBody>(null)
  const timeOnRailRef = useRef(0)
  const fadingRef = useRef(false)
  const drainedRef = useRef(false)
  const stuckWatchdogRef = useRef<StuckBallWatchdog | null>(null)

  // Created once per ball, lazily so the factory doesn't run on every render
  stuckWatchdogRef.current ??= createStuckBallWatchdog({
    stuckVelocity: BALL_STUCK_VELOCITY,
    framesBeforeAttempt: BALL_STUCK_FRAMES_BEFORE_ATTEMPT,
    restuckFrames: BALL_STUCK_RESTUCK_FRAMES,
    observeFrames: BALL_STUCK_OBSERVE_FRAMES,
    maxImpulseAttempts: BALL_STUCK_MAX_IMPULSE_ATTEMPTS,
    applyImpulse: applyUnstickImpulse,
    teleport: teleportToRandomPortal,
    // Only run the contagion BFS at the rare moment the watchdog would act
    isSuppressed: () =>
      isRestingByContagion(id, getBallPositionEntries(), BALL_REST_CONTACT_DISTANCE),
  })

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
      forgetFlipperContact(id)
      forgetBallContagion(id)
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

    // Seed this ball as at-rest when waiting in the plunger lane or cradled on a flipper, which spreads to balls stacked on it
    setBallAtRest(id, inPlungerLane || isBallOnFlipper(id))

    // Stuck-ball watchdog : skip while out of active play, the resting check then happens only when it would act
    if (
      useGameStore.getState().phase !== GAME_PHASE.Playing ||
      fadingRef.current ||
      drainedRef.current
    ) {
      stuckWatchdogRef.current?.reset()
    } else {
      stuckWatchdogRef.current?.tick(body)
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
          // A sensor-drained ball is already handled by the drain handler, but a ball that fell through the playfield tunneled the sensor, so commit its drain here instead of silently deleting it
          if (!drainedRef.current) commitBallDrain(id, DRAIN_RESPAWN_DELAY_MS)
        }}
      />
    </>
  )
}

export default Ball
