import useKeyboard from "@/hooks/useKeyboard"
import useBallStore from "@/stores/useBallStore"
import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody, CollisionPayload } from "@react-three/rapier"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useControls, button } from "leva"
import { useCallback, useRef } from "react"
import type { Group } from "three"
import {
  PLUNGER_BALL_SPAWN,
  PLUNGER_CHARGE_FACTOR,
  PLUNGER_KEY,
  PLUNGER_MIN_CHARGE,
  PLUNGER_LANE_FRICTION,
  PLUNGER_MAX_CHARGE_TIME,
  PLUNGER_MAX_COMPRESSION,
  PLUNGER_MAX_IMPULSE,
  PLUNGER_MIN_IMPULSE,
  PLUNGER_POSITION,
  PLUNGER_RELEASE_SPEED,
  PLUNGER_ROD_LENGTH,
  PLUNGER_ROD_RADIUS,
  PLUNGER_SPRING_RADIUS,
  PLUNGER_SPRING_SPACING,
  PLUNGER_SPRING_TORUS_COUNT,
  PLUNGER_SPRING_TUBE_RADIUS,
} from "./plungerConfig"

let ballInLane: RapierRigidBody | null = null

const Plunger = () => {
  const pressedKeys = useKeyboard()

  const chargeRef = useRef(0)
  const wasPressed = useRef(false)
  const releasingRef = useRef(false)
  const rodGroupRef = useRef<Group>(null)
  const rodBodyRef = useRef<RapierRigidBody>(null)
  const torusRefs = useRef<(Group | null)[]>([])

  const handleSpawn = useCallback(() => {
    if (useBallStore.getState().balls.length === 0) {
      useBallStore.getState().spawnBall(PLUNGER_BALL_SPAWN)
    }
  }, [])

  useControls("Main", {
    "Spawn in Lane": button(handleSpawn),
  })

  const handleBallEnter = useCallback(({ other }: CollisionPayload) => {
    if (other.rigidBodyObject?.name === "ball" && other.rigidBody) {
      ballInLane = other.rigidBody
    }
  }, [])

  const handleBallExit = useCallback(({ other }: CollisionPayload) => {
    if (other.rigidBodyObject?.name === "ball") {
      ballInLane = null
    }
  }, [])

  useFrame((_, delta) => {
    const isPressed = pressedKeys.current.has(PLUNGER_KEY)

    if (isPressed && !releasingRef.current) {
      chargeRef.current = Math.min(chargeRef.current + delta / PLUNGER_MAX_CHARGE_TIME, 1)
    }

    if (wasPressed.current && !isPressed && !releasingRef.current) {
      const charge = chargeRef.current

      if (charge >= PLUNGER_MIN_CHARGE) {
        releasingRef.current = true

        if (ballInLane) {
          const scaledCharge = Math.pow(charge, PLUNGER_CHARGE_FACTOR)
          const impulse =
            PLUNGER_MIN_IMPULSE + (PLUNGER_MAX_IMPULSE - PLUNGER_MIN_IMPULSE) * scaledCharge
          ballInLane.applyImpulse({ x: 0, y: 0, z: -impulse * ballInLane.mass() }, true)
        }
      } else {
        chargeRef.current = 0
      }
    }

    if (releasingRef.current) {
      chargeRef.current = Math.max(chargeRef.current - delta * PLUNGER_RELEASE_SPEED, 0)
      if (chargeRef.current <= 0) {
        releasingRef.current = false
      }
    }

    wasPressed.current = isPressed

    const compression = chargeRef.current * PLUNGER_MAX_COMPRESSION

    if (rodGroupRef.current) {
      rodGroupRef.current.position.z = compression
    }

    if (rodBodyRef.current) {
      const [px, py, pz] = PLUNGER_POSITION
      rodBodyRef.current.setNextKinematicTranslation({
        x: px,
        y: py,
        z: pz + compression,
      })
    }

    const compressedSpacing = PLUNGER_SPRING_SPACING * (1 - chargeRef.current * 0.6)
    for (let i = 0; i < PLUNGER_SPRING_TORUS_COUNT; i++) {
      const torus = torusRefs.current[i]
      if (!torus) continue
      torus.position.z = compressedSpacing * (i + 1) + compression
    }
  })

  return (
    <group position={PLUNGER_POSITION}>
      <RigidBody type="fixed" colliders={false} friction={PLUNGER_LANE_FRICTION}>
        <CuboidCollider
          sensor
          name="plunger-sensor"
          args={[PLUNGER_SPRING_RADIUS + 0.1, 0.3, 0.8]}
          position={[0, 0, -0.5]}
          onIntersectionEnter={handleBallEnter}
          onIntersectionExit={handleBallExit}
        />
      </RigidBody>

      <RigidBody ref={rodBodyRef} type="kinematicPosition" colliders={false}>
        <CuboidCollider args={[PLUNGER_ROD_RADIUS, PLUNGER_ROD_RADIUS, PLUNGER_ROD_LENGTH / 2]} />
      </RigidBody>

      <group ref={rodGroupRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry
            args={[PLUNGER_ROD_RADIUS, PLUNGER_ROD_RADIUS, PLUNGER_ROD_LENGTH, 16]}
          />
          <meshStandardMaterial color="#888" />
        </mesh>
      </group>

      {Array.from({ length: PLUNGER_SPRING_TORUS_COUNT }).map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            torusRefs.current[i] = el
          }}
          position={[0, 0, PLUNGER_SPRING_SPACING * (i + 1)]}
        >
          <mesh>
            <torusGeometry args={[PLUNGER_SPRING_RADIUS, PLUNGER_SPRING_TUBE_RADIUS, 8, 24]} />
            <meshStandardMaterial color="#aaa" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default Plunger
