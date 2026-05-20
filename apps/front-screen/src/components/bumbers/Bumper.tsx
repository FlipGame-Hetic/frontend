import type { PositionType } from "@/types/worldTypes"
import { broadcastEvent } from "@frontend/ws"
import { useFrame } from "@react-three/fiber"
import useGameStore from "@/stores/useGameStore"
import { BUMPER_SCORE } from "@/config/scoreConfig"
import type { RapierRigidBody } from "@react-three/rapier"
import { RigidBody, type CollisionEnterPayload } from "@react-three/rapier"
import { usePhysicsDebugControls } from "@/debug/physicsDebugContext"
import { useCallback, useRef } from "react"
import type { Group, Mesh } from "three"
import { normalizedPlayfieldDirection } from "../physics/playfieldPlane"
import {
  clampBallVelocityToPlayfield,
  normalizedPlanarBounceDirection,
} from "../physics/playfieldPlane"
import { BUMPER_SCALE_FACTOR, BUMPER_SIZE_ARGS } from "./bumperConfig"

interface BumperProps {
  position: PositionType
  bumperId: number
  meshOverride?: Mesh
  rubberMesh?: Mesh
}

const Bumper = ({ position, bumperId, meshOverride, rubberMesh }: BumperProps) => {
  const bodyRef = useRef<RapierRigidBody>(null)
  const meshRef = useRef<Mesh>(null)
  const rubberGroupRef = useRef<Group>(null)
  const isBouncing = useRef(false)
  const stuckBall = useRef<{ body: RapierRigidBody; frames: number } | null>(null)

  const {
    ball: { maxTangentSpeed, minNormalSpeed, maxNormalSpeed },
    bumpers: { restitution, impulseStrength, stuckFrames, stuckVelocity, unstickImpulse },
  } = usePhysicsDebugControls()

  const handleCollision = useCallback(
    ({ other }: CollisionEnterPayload) => {
      isBouncing.current = true
      setTimeout(() => {
        isBouncing.current = false
      }, 150)

      if (!bodyRef.current || !other.rigidBody) return
      if (other.rigidBodyObject?.name !== "ball") return

      broadcastEvent({ event_type: "bumper_hit", payload: { bumper_id: bumperId } })
      useGameStore.getState().addScore(BUMPER_SCORE)

      const bumperPos = bodyRef.current.translation()
      const ballPos = other.rigidBody.translation()

      const dir = normalizedPlayfieldDirection({
        x: ballPos.x - bumperPos.x,
        y: ballPos.y - bumperPos.y,
        z: ballPos.z - bumperPos.z,
      })

      if (!dir) return

      const ballMass = other.rigidBody.mass()
      const impulseMag = impulseStrength * ballMass

      other.rigidBody.applyImpulse(
        { x: dir.x * impulseMag, y: dir.y * impulseMag, z: dir.z * impulseMag },
        true,
      )

      stuckBall.current = { body: other.rigidBody, frames: 0 }
    },
    [impulseStrength, bumperId, maxTangentSpeed, minNormalSpeed, maxNormalSpeed],
  )

  useFrame(() => {
    const animTarget = rubberGroupRef.current ?? meshRef.current
    if (animTarget) {
      if (isBouncing.current && animTarget.scale.x < BUMPER_SCALE_FACTOR) {
        animTarget.scale.x += 0.05
        animTarget.scale.z += 0.05
      } else if (animTarget.scale.x > 1) {
        animTarget.scale.x -= 0.05
        animTarget.scale.z -= 0.05
      }
    }

    if (!stuckBall.current || !bodyRef.current) return
    const ball = stuckBall.current.body

    const vel = ball.linvel()
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)

    if (speed > stuckVelocity) {
      stuckBall.current = null
      return
    }

    stuckBall.current.frames++

    if (stuckBall.current.frames >= stuckFrames) {
      const angle = Math.random() * Math.PI * 2
      const ballMass = ball.mass()
      const dir = normalizedPlayfieldDirection({ x: Math.cos(angle), y: 0, z: Math.sin(angle) })

      if (!dir) return

      ball.applyImpulse(
        {
          x: dir.x * unstickImpulse * ballMass,
          y: dir.y * unstickImpulse * ballMass,
          z: dir.z * unstickImpulse * ballMass,
        },
        true,
      )
      ball.setLinvel(
        clampBallVelocityToPlayfield(
          ball.linvel(),
          maxTangentSpeed,
          minNormalSpeed,
          maxNormalSpeed,
        ),
        true,
      )
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
      {meshOverride ? (
        <>
          <primitive object={meshOverride} />
          {rubberMesh && (
            <group ref={rubberGroupRef}>
              <primitive object={rubberMesh} />
            </group>
          )}
        </>
      ) : (
        <mesh ref={meshRef}>
          <cylinderGeometry args={BUMPER_SIZE_ARGS} />
          <meshStandardMaterial />
        </mesh>
      )}
    </RigidBody>
  )
}

export default Bumper
