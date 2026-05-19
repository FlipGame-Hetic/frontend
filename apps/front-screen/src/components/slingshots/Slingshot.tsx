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
import { useControls } from "leva"
import { useCallback, useMemo, useRef } from "react"
import * as THREE from "three"
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
  SLINGSHOT_DEPTH,
  SLINGSHOT_HEIGHT,
  SLINGSHOT_RESTITUTION,
  SLINGSHOT_STUCK_FRAMES,
  SLINGSHOT_STUCK_VELOCITY,
  SLINGSHOT_TREMBLE_AMP,
  SLINGSHOT_TREMBLE_DURATION,
  SLINGSHOT_TREMBLE_FREQ,
} from "./slingshotConfig"

interface SlingshotProps {
  position: PositionType
  side: "left" | "right"
  slingshotId: number
  meshOverride?: THREE.Mesh
}

const Slingshot = ({ position, side, slingshotId, meshOverride }: SlingshotProps) => {
  const rubberBodyRef = useRef<RapierRigidBody>(null)
  const rubberRef = useRef<THREE.Mesh>(null)
  const hitAt = useRef(-Infinity)
  const stuckBall = useRef<{ body: RapierRigidBody; frames: number } | null>(null)

  const { restitution, impulseStrength, stuckFrames, stuckVelocity, unstickImpulse } =
    usePhysicsDebugControls().slingshots

  const { restitution, stuckFrames, stuckVelocity, unstickImpulse } = useControls("Slingshots", {
    restitution: { value: SLINGSHOT_RESTITUTION, min: 0, max: 100, step: 0.5 },
    stuckFrames: { value: SLINGSHOT_STUCK_FRAMES, min: 5, max: 120, step: 5 },
    stuckVelocity: { value: SLINGSHOT_STUCK_VELOCITY, min: 0.1, max: 5, step: 0.1 },
    unstickImpulse: { value: SLINGSHOT_UNSTICK_IMPULSE, min: 0, max: 40, step: 0.5 },
  })

  const triangleGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(xDir * SLINGSHOT_WIDTH, 0)
    shape.lineTo(0, SLINGSHOT_DEPTH)
    shape.closePath()
    const geom = new THREE.ExtrudeGeometry(shape, { depth: SLINGSHOT_HEIGHT, bevelEnabled: false })
    geom.rotateX(-Math.PI / 2)
    return geom
  }, [xDir])

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

      const rubberPos = rubberBodyRef.current.translation()
      const ballPos = other.rigidBody.translation()
      const exitDir = normalizedPlayfieldDirection({
        x: ballPos.x - rubberPos.x,
        y: ballPos.y - rubberPos.y,
        z: ballPos.z - rubberPos.z,
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
        colliders={false}
        position={position}
        onCollisionEnter={handleCollision}
        restitution={restitution}
      >
        <MeshCollider type="hull">
          <primitive object={meshOverride} />
        </MeshCollider>
      </RigidBody>
    )
  }

  return (
    <>
      {/* Triangle body: 2 murs non-rubber, restitution 0 */}
      <RigidBody type="fixed" colliders={false} position={position}>
        <CuboidCollider
          args={[SLINGSHOT_WIDTH / 2, SLINGSHOT_HEIGHT / 2, 0.05]}
          position={[(xDir * SLINGSHOT_WIDTH) / 2, SLINGSHOT_HEIGHT / 2, 0]}
        />
        <CuboidCollider
          args={[0.05, SLINGSHOT_HEIGHT / 2, SLINGSHOT_DEPTH / 2]}
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
        colliders={false}
        position={position}
        onCollisionEnter={handleCollision}
        restitution={restitution}
      >
        <MeshCollider type="hull">
          <mesh
            ref={rubberRef}
            position={rubberTransform.position}
            rotation={[0, rubberTransform.rotationY, 0]}
          >
            <boxGeometry args={[0.08, SLINGSHOT_HEIGHT, rubberTransform.length]} />
            <meshStandardMaterial color="#d33" />
          </mesh>
        </MeshCollider>
      </RigidBody>
    </>
  )
}

export default Slingshot
