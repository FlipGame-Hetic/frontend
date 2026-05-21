import type { PositionType } from "@/types/worldTypes"
import { broadcastEvent } from "@frontend/ws"
import { useFrame } from "@react-three/fiber"
import useGameStore from "@/stores/useGameStore"
import { SLINGSHOT_SCORE } from "@/config/scoreConfig"
import {
  CuboidCollider,
  MeshCollider,
  RigidBody,
  type CollisionEnterPayload,
  type RapierRigidBody,
} from "@react-three/rapier"
import { usePhysicsDebugControls } from "@/debug/physicsDebugContext"
import { useCallback, useMemo, useRef } from "react"
import type { Group, Mesh } from "three"
import { normalizedPlayfieldDirection } from "../physics/playfieldPlane"
import {
  SLINGSHOT_ACTIVE_FACE_POINTS,
  SLINGSHOT_FACE_HEIGHT,
  SLINGSHOT_FACE_OUTSET,
  SLINGSHOT_FACE_THICKNESS,
  SLINGSHOT_TREMBLE_AMP,
  SLINGSHOT_TREMBLE_DURATION,
  SLINGSHOT_TREMBLE_FREQ,
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

  const { restitution, impulseStrength, stuckFrames, stuckVelocity, unstickImpulse } =
    usePhysicsDebugControls().slingshots

  const activeFace = useMemo(() => {
    const face = SLINGSHOT_ACTIVE_FACE_POINTS[side]
    const [startX, startZ] = face.start
    const [endX, endZ] = face.end
    const [normalX, normalZ] = face.normal
    const dx = endX - startX
    const dz = endZ - startZ
    const length = Math.hypot(dx, dz)
    const angle = Math.atan2(dz, dx)

    return {
      args: [length / 2, SLINGSHOT_FACE_HEIGHT / 2, SLINGSHOT_FACE_THICKNESS / 2] as [
        number,
        number,
        number,
      ],
      normal: { x: normalX, z: normalZ },
      position: [
        (startX + endX) / 2 + normalX * SLINGSHOT_FACE_OUTSET,
        0,
        (startZ + endZ) / 2 + normalZ * SLINGSHOT_FACE_OUTSET,
      ] as [number, number, number],
      rotation: [0, -angle, 0] as [number, number, number],
    }
  }, [side])

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
        const mass = other.rigidBody.mass()
        other.rigidBody.applyImpulse(
          {
            x: exitDir.x * impulseStrength * mass,
            y: exitDir.y * impulseStrength * mass,
            z: exitDir.z * impulseStrength * mass,
          },
          true,
        )
      }

      stuckBall.current = { body: other.rigidBody, frames: 0 }
    },
    [impulseStrength, slingshotId],
  )

  useFrame(() => {
    if (rubberGroupRef.current) {
      const t = performance.now() / 1000 - hitAt.current
      if (t < SLINGSHOT_TREMBLE_DURATION) {
        const decay = 1 - t / SLINGSHOT_TREMBLE_DURATION
        const offset = Math.sin(t * SLINGSHOT_TREMBLE_FREQ) * SLINGSHOT_TREMBLE_AMP * decay
        rubberGroupRef.current.position.x = activeFace.normal.x * offset
        rubberGroupRef.current.position.z = activeFace.normal.z * offset
      } else {
        rubberGroupRef.current.position.x = 0
        rubberGroupRef.current.position.z = 0
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

  return (
    <RigidBody ref={bodyRef} type="fixed" colliders={false} position={position}>
      <MeshCollider type="hull">
        <primitive object={moduleMesh} />
      </MeshCollider>
      <CuboidCollider
        args={activeFace.args}
        position={activeFace.position}
        rotation={activeFace.rotation}
        restitution={restitution}
        friction={0}
        onCollisionEnter={handleCollision}
      />
      {rubberMesh && (
        <group ref={rubberGroupRef}>
          <primitive object={rubberMesh} />
        </group>
      )}
    </RigidBody>
  )
}

export default Slingshot
