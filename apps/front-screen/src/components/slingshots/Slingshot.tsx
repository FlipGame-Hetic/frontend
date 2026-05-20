import type { PositionType } from "@/types/worldTypes"
import { broadcastEvent } from "@frontend/ws"
import { useFrame } from "@react-three/fiber"
import useGameStore from "@/stores/useGameStore"
import { SLINGSHOT_SCORE } from "@/config/scoreConfig"
import {
  MeshCollider,
  RigidBody,
  type CollisionEnterPayload,
  type RapierRigidBody,
} from "@react-three/rapier"
import { useControls } from "leva"
import { useCallback, useRef } from "react"
import type { Group, Mesh } from "three"
import {
  clampVelocityToPlayfield,
  normalizedPlayfieldDirection,
  projectOnPlayfield,
} from "../physics/playfieldPlane"
import {
  BALL_MAX_NORMAL_SPEED,
  BALL_MAX_TANGENT_SPEED,
  BALL_MIN_NORMAL_SPEED,
} from "../balls/ballConfig"
import {
  SLINGSHOT_RESTITUTION,
  SLINGSHOT_STUCK_FRAMES,
  SLINGSHOT_STUCK_VELOCITY,
  SLINGSHOT_TREMBLE_AMP,
  SLINGSHOT_TREMBLE_DURATION,
  SLINGSHOT_TREMBLE_FREQ,
  SLINGSHOT_UNSTICK_IMPULSE,
} from "./slingshotConfig"

interface SlingshotProps {
  position: PositionType
  side: "left" | "right"
  slingshotId: number
  moduleMesh: Mesh
  rubberMesh?: Mesh
}

const Slingshot = ({ position, side, slingshotId, moduleMesh, rubberMesh }: SlingshotProps) => {
  const bodyRef = useRef<RapierRigidBody>(null)
  const rubberGroupRef = useRef<Group>(null)
  const hitAt = useRef(-Infinity)
  const stuckBall = useRef<{ body: RapierRigidBody; frames: number } | null>(null)

  const { restitution, stuckFrames, stuckVelocity, unstickImpulse } = useControls("Slingshots", {
    restitution: { value: SLINGSHOT_RESTITUTION, min: 0, max: 100, step: 0.5 },
    stuckFrames: { value: SLINGSHOT_STUCK_FRAMES, min: 5, max: 120, step: 5 },
    stuckVelocity: { value: SLINGSHOT_STUCK_VELOCITY, min: 0.1, max: 5, step: 0.1 },
    unstickImpulse: { value: SLINGSHOT_UNSTICK_IMPULSE, min: 0, max: 40, step: 0.5 },
  })

  const handleCollision = useCallback(
    ({ other }: CollisionEnterPayload) => {
      if (!bodyRef.current || !other.rigidBody) return
      if (other.rigidBodyObject?.name !== "ball") return
      broadcastEvent({ event_type: "slingshot_hit", payload: { slingshot_id: slingshotId } })
      useGameStore.getState().addScore(SLINGSHOT_SCORE)
      hitAt.current = performance.now() / 1000

      const slingshotPos = bodyRef.current.translation()
      const ballPos = other.rigidBody.translation()
      const exitDir = normalizedPlayfieldDirection({
        x: ballPos.x - slingshotPos.x,
        y: ballPos.y - slingshotPos.y,
        z: ballPos.z - slingshotPos.z,
      })

      if (exitDir) {
        const velocity = other.rigidBody.linvel()
        const tangentVelocity = projectOnPlayfield(velocity)
        const tangentSpeed = Math.hypot(tangentVelocity.x, tangentVelocity.y, tangentVelocity.z)
        const exitSpeed = Math.max(tangentSpeed, restitution)
        const nextVelocity = clampVelocityToPlayfield(
          {
            x: exitDir.x * exitSpeed,
            y: exitDir.y * exitSpeed,
            z: exitDir.z * exitSpeed,
          },
          BALL_MAX_TANGENT_SPEED,
          BALL_MIN_NORMAL_SPEED,
          BALL_MAX_NORMAL_SPEED,
        )
        other.rigidBody.setLinvel(nextVelocity, true)
      }

      stuckBall.current = { body: other.rigidBody, frames: 0 }
    },
    [restitution, slingshotId],
  )

  useFrame(() => {
    if (rubberGroupRef.current) {
      const t = performance.now() / 1000 - hitAt.current
      if (t < SLINGSHOT_TREMBLE_DURATION) {
        const decay = 1 - t / SLINGSHOT_TREMBLE_DURATION
        rubberGroupRef.current.position.x =
          Math.sin(t * SLINGSHOT_TREMBLE_FREQ) * SLINGSHOT_TREMBLE_AMP * decay
      } else {
        rubberGroupRef.current.position.x = 0
      }
    }

    if (!stuckBall.current || !bodyRef.current) return
    const ball = stuckBall.current.body
    const v = ball.linvel()
    if (Math.hypot(v.x, v.y, v.z) > stuckVelocity) {
      stuckBall.current = null
      return
    }
    stuckBall.current.frames++
    if (stuckBall.current.frames >= stuckFrames) {
      const a = Math.random() * Math.PI * 2
      const m = ball.mass()
      const dir = normalizedPlayfieldDirection({ x: Math.cos(a), y: 0, z: Math.sin(a) })
      if (!dir) return
      ball.applyImpulse(
        {
          x: dir.x * unstickImpulse * m,
          y: dir.y * unstickImpulse * m,
          z: dir.z * unstickImpulse * m,
        },
        true,
      )
      stuckBall.current = null
    }
  })

  void side

  return (
    <RigidBody
      ref={bodyRef}
      type="fixed"
      colliders={false}
      position={position}
      onCollisionEnter={handleCollision}
    >
      <MeshCollider type="hull">
        <primitive object={moduleMesh} />
      </MeshCollider>
      {rubberMesh && (
        <group ref={rubberGroupRef}>
          <primitive object={rubberMesh} />
        </group>
      )}
    </RigidBody>
  )
}

export default Slingshot
