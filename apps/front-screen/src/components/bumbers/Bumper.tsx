import type { PositionType } from "@/types/worldTypes"
import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { RigidBody, type CollisionEnterPayload } from "@react-three/rapier"
import { useControls } from "leva"
import { useCallback, useRef } from "react"
import * as THREE from "three"
import type { Mesh } from "three"
import { usePlayfieldFrame } from "../physics/usePlayfieldFrame"
import {
  BUMPER_IMPULSE_STRENGTH,
  BUMPER_RESTITUTION,
  BUMPER_SCALE_FACTOR,
  BUMPER_SIZE_ARGS,
  BUMPER_STUCK_FRAMES,
  BUMPER_STUCK_VELOCITY,
  BUMPER_UNSTICK_IMPULSE,
} from "./bumperConfig"

interface BumperProps {
  position: PositionType
}

const Bumper = ({ position }: BumperProps) => {
  const bodyRef = useRef<RapierRigidBody>(null)
  const meshRef = useRef<Mesh>(null)
  const isBouncing = useRef(false)
  const stuckBall = useRef<{ body: RapierRigidBody; frames: number } | null>(null)

  const { localToWorldVector, worldToLocalVector } = usePlayfieldFrame()
  const tmpDelta = useRef(new THREE.Vector3())
  const tmpImpulse = useRef(new THREE.Vector3())
  const tmpVel = useRef(new THREE.Vector3())

  const { restitution, impulseStrength, stuckFrames, stuckVelocity, unstickImpulse } = useControls(
    "Bumpers",
    {
      restitution: { value: BUMPER_RESTITUTION, min: 0, max: 1.0, step: 0.05 },
      impulseStrength: { value: BUMPER_IMPULSE_STRENGTH, min: 1, max: 50, step: 1 },
      stuckFrames: { value: BUMPER_STUCK_FRAMES, min: 10, max: 120, step: 5 },
      stuckVelocity: { value: BUMPER_STUCK_VELOCITY, min: 0.1, max: 2.0, step: 0.1 },
      unstickImpulse: { value: BUMPER_UNSTICK_IMPULSE, min: 1, max: 20, step: 1 },
    },
  )

  const handleCollision = useCallback(
    ({ other }: CollisionEnterPayload) => {
      isBouncing.current = true
      setTimeout(() => {
        isBouncing.current = false
      }, 150)

      if (!bodyRef.current || !other.rigidBody) return
      if (other.rigidBodyObject?.name !== "ball") return

      const bumperPos = bodyRef.current.translation()
      const ballPos = other.rigidBody.translation()

      const deltaLocal = worldToLocalVector(
        {
          x: ballPos.x - bumperPos.x,
          y: ballPos.y - bumperPos.y,
          z: ballPos.z - bumperPos.z,
        },
        tmpDelta.current,
      )
      const dirLen = Math.sqrt(deltaLocal.x * deltaLocal.x + deltaLocal.z * deltaLocal.z)

      if (dirLen < 0.001) return

      const nx = deltaLocal.x / dirLen
      const nz = deltaLocal.z / dirLen

      const ballMass = other.rigidBody.mass()
      const impulseMag = impulseStrength * ballMass

      const impulseWorld = localToWorldVector(
        { x: nx * impulseMag, y: 0, z: nz * impulseMag },
        tmpImpulse.current,
      )
      other.rigidBody.applyImpulse(impulseWorld, true)

      stuckBall.current = { body: other.rigidBody, frames: 0 }
    },
    [impulseStrength, localToWorldVector, worldToLocalVector],
  )

  useFrame(() => {
    if (!meshRef.current) return
    if (isBouncing.current && meshRef.current.scale.x < BUMPER_SCALE_FACTOR) {
      meshRef.current.scale.x += 0.05
      meshRef.current.scale.z += 0.05
    } else if (meshRef.current.scale.x > 1) {
      meshRef.current.scale.x -= 0.05
      meshRef.current.scale.z -= 0.05
    }

    if (!stuckBall.current || !bodyRef.current) return
    const ball = stuckBall.current.body

    const velLocal = worldToLocalVector(ball.linvel(), tmpVel.current)
    const speedPlanar = Math.sqrt(
      velLocal.x * velLocal.x + velLocal.y * velLocal.y + velLocal.z * velLocal.z,
    )

    if (speedPlanar > stuckVelocity) {
      stuckBall.current = null
      return
    }

    stuckBall.current.frames++

    if (stuckBall.current.frames >= stuckFrames) {
      const angle = Math.random() * Math.PI * 2
      const ballMass = ball.mass()
      const impulseWorld = localToWorldVector(
        {
          x: Math.cos(angle) * unstickImpulse * ballMass,
          y: 0,
          z: Math.sin(angle) * unstickImpulse * ballMass,
        },
        tmpImpulse.current,
      )
      ball.applyImpulse(impulseWorld, true)
      stuckBall.current = null
    }
  })

  return (
    <RigidBody
      ref={bodyRef}
      type="fixed"
      colliders="hull"
      position={position}
      onCollisionEnter={handleCollision}
      restitution={restitution}
    >
      <mesh ref={meshRef}>
        <cylinderGeometry args={BUMPER_SIZE_ARGS} />
        <meshStandardMaterial />
      </mesh>
    </RigidBody>
  )
}

export default Bumper
