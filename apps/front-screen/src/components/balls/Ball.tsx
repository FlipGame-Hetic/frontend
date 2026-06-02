import BallTrail from "./BallTrail"
import useBallStore from "@/stores/useBallStore"
import { isPointInPlungerLaneSensor } from "@/components/plunger/plungerConfig"
import type { PositionType } from "@/types/worldTypes"
import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { RigidBody } from "@react-three/rapier"
import { useEffect, useRef } from "react"
import { DRAIN_SAFETY_FALLBACK_Y } from "../drain/drainConfig"
import { registerBallFade, unregisterBallFade } from "./ballFadeRegistry"
import useBallMaterial from "./useBallMaterial"
import { clampVelocityToPlayfield } from "../physics/playfieldPlane"
import { BALL_COLLISION_GROUPS_WITH_RAILS } from "../playfield/railCollisionGroups"
import { isOnRail, cleanupRailBall } from "../playfield/railState"
import {
  RAIL_BASE_ACCEL,
  RAIL_BOOST_PER_SECOND,
  RAIL_MAX_ACCEL,
  RAIL_MIN_VEL,
} from "../playfield/railConfig"
import { BALL_RADIUS } from "./ballConfig"

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
  const { deleteBall } = useBallStore()
  const ballRef = useRef<RapierRigidBody>(null)
  const timeOnRailRef = useRef(0)
  const fadingRef = useRef(false)
  const drainedRef = useRef(false)

  const meshRef = useBallMaterial(color)

  useEffect(() => {
    registerBallFade(id, () => {
      fadingRef.current = true
      drainedRef.current = true
    })
    return () => {
      unregisterBallFade(id)
      cleanupRailBall(id)
    }
  }, [id])

  useFrame((_, delta) => {
    const body = ballRef.current
    if (!body) return

    const pos = body.translation()

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
        colliders="ball"
        ccd
        name="ball"
        userData={{ ballId: id }}
        mass={mass}
        restitution={restitution}
        friction={friction}
        linearDamping={linearDamping}
        angularDamping={angularDamping}
        collisionGroups={BALL_COLLISION_GROUPS_WITH_RAILS}
      >
        <mesh ref={meshRef} castShadow>
          <sphereGeometry args={[radius, 32, 32]} />
        </mesh>
      </RigidBody>
      <BallTrail
        ballRef={ballRef}
        color={color}
        fadingRef={fadingRef}
        onFadeComplete={() => {
          if (!drainedRef.current) deleteBall(id)
        }}
      />
    </>
  )
}

export default Ball
