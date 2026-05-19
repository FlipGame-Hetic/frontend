import useKeyboard from "@/hooks/useKeyboard"
import { usePhysicsDebugControls } from "@/debug/physicsDebugContext"
import { getPlungerInputSnapshot } from "@/stores/inputStore"
import type { PositionType } from "@/types/worldTypes"
import { useFrame } from "@react-three/fiber"
import type { CollisionPayload, RapierRigidBody } from "@react-three/rapier"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useCallback, useMemo, useRef } from "react"
import type { Group, Mesh } from "three"
import { Vector3 } from "three"
import { normalizedPlayfieldDirection } from "../physics/playfieldPlane"
import {
  clampPlungerPosition,
  PLUNGER_KEY,
  PLUNGER_LANE_FRICTION,
  PLUNGER_MAX_CHARGE_TIME,
  PLUNGER_RELEASE_DELAY,
  PLUNGER_MAX_COMPRESSION,
  PLUNGER_MAX_IMPULSE,
  PLUNGER_MIN_IMPULSE,
  PLUNGER_POSITION,
  PLUNGER_PULL_KEY,
  PLUNGER_RETURN_KEY,
  PLUNGER_ROD_LENGTH,
  PLUNGER_ROD_RADIUS,
  PLUNGER_SPRING_RADIUS,
  PLUNGER_SPRING_SPACING,
  PLUNGER_SPRING_TORUS_COUNT,
  PLUNGER_SPRING_TUBE_RADIUS,
} from "./plungerConfig"

let ballInLane: RapierRigidBody | null = null

export interface PlungerMeshPart {
  mesh: Mesh
  position: PositionType
}

interface PlungerProps {
  position?: PositionType
  tipMesh?: PlungerMeshPart
  ringMeshes?: PlungerMeshPart[]
}

function toVector3(position: PositionType): Vector3 {
  return new Vector3(position[0], position[1], position[2])
}

const Plunger = ({ position = PLUNGER_POSITION, tipMesh, ringMeshes = [] }: PlungerProps) => {
  const pressedKeys = useKeyboard()
  const plunger = usePhysicsDebugControls().plunger

  const plungerPositionRef = useRef(0)
  const wasSpacePressed = useRef(false)
  const wasArrowPressed = useRef(false)
  const releasingRef = useRef(false)
  const pendingReleaseRef = useRef(false)
  const releaseTimerRef = useRef(0)
  const rodGroupRef = useRef<Group>(null)
  const rodBodyRef = useRef<RapierRigidBody>(null)
  const torusRefs = useRef<(Group | null)[]>([])
  const ringRefs = useRef<(Group | null)[]>([])
  const lastPlungerReleaseToken = useRef(getPlungerInputSnapshot().releaseToken)

  const rootPosition = useMemo(() => toVector3(position), [position])
  const tipRestPosition = useMemo(
    () => toVector3(tipMesh?.position ?? [0, 0, 0]),
    [tipMesh?.position],
  )
  const ringRestPositions = useMemo(
    () => ringMeshes.map((part) => toVector3(part.position)),
    [ringMeshes],
  )
  const movementAxis = useMemo(() => {
    const backRing = ringRestPositions.at(-1)
    if (!backRing) return new Vector3(0, 0, 1)
    const axis = backRing.clone().sub(tipRestPosition)
    if (axis.lengthSq() === 0) return new Vector3(0, 0, 1)
    return axis.normalize()
  }, [ringRestPositions, tipRestPosition])

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

  const releaseFromPosition = useCallback(
    (position: number) => {
      const charge = clampPlungerPosition(position)

    if (isPressed && !releasingRef.current && !pendingReleaseRef.current) {
      chargeRef.current = Math.min(chargeRef.current + delta / PLUNGER_MAX_CHARGE_TIME, 1)
    }

    if (wasPressed.current && !isPressed && !releasingRef.current && !pendingReleaseRef.current) {
      const charge = chargeRef.current

      if (charge >= PLUNGER_MIN_CHARGE) {
        if (ballInLane) {
          const scaledCharge = Math.pow(charge, PLUNGER_CHARGE_FACTOR)
          const impulse =
            PLUNGER_MIN_IMPULSE + (PLUNGER_MAX_IMPULSE - PLUNGER_MIN_IMPULSE) * scaledCharge
          ballInLane.applyImpulse({ x: 0, y: 0, z: -impulse * ballInLane.mass() }, true)
        }
        pendingReleaseRef.current = true
        releaseTimerRef.current = PLUNGER_RELEASE_DELAY
      } else {
        waitForBallClearRef.current = false
        ballClearTimerRef.current = 0
        pendingReleaseRef.current = false
        releasingRef.current = true
      }
    }

    if (pendingReleaseRef.current) {
      releaseTimerRef.current -= delta
      if (releaseTimerRef.current <= 0) {
        pendingReleaseRef.current = false
        releasingRef.current = true
      }
    }

    if (releasingRef.current) {
      plungerPositionRef.current = Math.max(
        plungerPositionRef.current - delta * plunger.releaseSpeed,
        0,
      )
      if (plungerPositionRef.current <= 0) {
        releasingRef.current = false
      }
    }

    wasSpacePressed.current = isSpacePressed
    wasArrowPressed.current = isArrowPressed

    const compression = plungerPositionRef.current * plunger.maxCompression
    const offset = movementAxis.clone().multiplyScalar(compression)

    if (tipGroupRef.current) {
      tipGroupRef.current.position.copy(tipRestPosition).add(offset)
    }

    if (rodBodyRef.current) {
      const colliderPosition = rootPosition.clone().add(tipRestPosition).add(offset)
      rodBodyRef.current.setNextKinematicTranslation({
        x: colliderPosition.x,
        y: colliderPosition.y,
        z: colliderPosition.z,
      })
    }

    if (ringMeshes.length > 0 && ringRestPositions.length > 0) {
      const backRestPosition = ringRestPositions[ringRestPositions.length - 1]
      const frontRestPosition = ringRestPositions[0]
      if (!backRestPosition || !frontRestPosition) return

      const restLength = Math.max(
        backRestPosition.clone().sub(frontRestPosition).dot(movementAxis),
        0,
      )
      const compressedLength = restLength * (1 - plungerPositionRef.current * 0.6)

      for (let i = 0; i < ringRefs.current.length; i++) {
        const ring = ringRefs.current[i]
        if (!ring) continue
        const t = ringRefs.current.length <= 1 ? 0 : i / (ringRefs.current.length - 1)
        ring.position
          .copy(backRestPosition)
          .add(movementAxis.clone().multiplyScalar(-compressedLength * (1 - t)))
      }
      return
    }

    const compressedSpacing = PLUNGER_SPRING_SPACING * (1 - plungerPositionRef.current * 0.6)
    for (let i = 0; i < PLUNGER_SPRING_TORUS_COUNT; i++) {
      const torus = torusRefs.current[i]
      if (!torus) continue
      torus.position.z = compressedSpacing * (i + 1) + compression
    }
  })

  return (
    <group position={position}>
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

      <group ref={tipGroupRef} position={tipMesh?.position ?? [0, 0, 0]}>
        {tipMesh ? (
          <primitive object={tipMesh.mesh} />
        ) : (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry
              args={[PLUNGER_ROD_RADIUS, PLUNGER_ROD_RADIUS, PLUNGER_ROD_LENGTH, 16]}
            />
            <meshStandardMaterial color="#888" />
          </mesh>
        )}
      </group>

      {ringMeshes.length > 0
        ? ringMeshes.map((part, i) => (
            <group
              key={part.mesh.uuid}
              ref={(el) => {
                ringRefs.current[i] = el
              }}
              position={part.position}
            >
              <primitive object={part.mesh} />
            </group>
          ))
        : Array.from({ length: PLUNGER_SPRING_TORUS_COUNT }).map((_, i) => (
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
