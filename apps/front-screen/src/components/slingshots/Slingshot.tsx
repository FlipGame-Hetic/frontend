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
import * as THREE from "three"
import type { Mesh } from "three"
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
  meshOverride?: Mesh
}

const Slingshot = ({ position, side, slingshotId, meshOverride }: SlingshotProps) => {
  const rubberBodyRef = useRef<RapierRigidBody>(null)
  const rubberRef = useRef<THREE.Mesh>(null)
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

  if (meshOverride) {
    return (
      <RigidBody
        ref={rubberBodyRef}
        type="fixed"
        colliders="hull"
        position={position}
        restitution={SLINGSHOT_RESTITUTION}
        onCollisionEnter={handleCollision}
      >
        <primitive object={meshOverride} />
      </RigidBody>
    )
  }

  return (
    <>
      {/* Triangle body: 2 murs non-rubber, restitution 0 */}
      <RigidBody type="fixed" colliders={false} position={position}>
        <CuboidCollider
          args={[SLINGSHOT_WIDTH / 2, SLINGSHOT_HEIGHT / 2, 0.003]}
          position={[(xDir * SLINGSHOT_WIDTH) / 2, SLINGSHOT_HEIGHT / 2, 0]}
        />
        <CuboidCollider
          args={[0.003, SLINGSHOT_HEIGHT / 2, SLINGSHOT_DEPTH / 2]}
          position={[0, SLINGSHOT_HEIGHT / 2, -SLINGSHOT_DEPTH / 2]}
        />
        <mesh geometry={triangleGeometry}>
          <meshStandardMaterial color="#cccccc" />
        </mesh>
      </RigidBody>

      {/* Rubber: restitution élevée, collision handler, animation tremble */}
      <RigidBody
        ref={rubberBodyRef}
        type="fixed"
        colliders="hull"
        position={position}
        restitution={SLINGSHOT_RESTITUTION}
        onCollisionEnter={handleCollision}
      >
        <mesh
          ref={rubberRef}
          position={rubberTransform.position}
          rotation={[0, rubberTransform.rotationY, 0]}
        >
          <boxGeometry args={[0.005, SLINGSHOT_HEIGHT, rubberTransform.length]} />
          <meshStandardMaterial color="#d33" />
        </mesh>
      </RigidBody>
    </>
  )
}

export default Slingshot
