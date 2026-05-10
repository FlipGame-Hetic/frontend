import type { PositionType } from "@/types/worldTypes"
import { sendSlingshotHit } from "@/stores/screenSender"
import { useFrame } from "@react-three/fiber"
import {
  CuboidCollider,
  RigidBody,
  type CollisionEnterPayload,
  type RapierRigidBody,
} from "@react-three/rapier"
import { useCallback, useMemo, useRef } from "react"
import * as THREE from "three"
import {
  SLINGSHOT_DEPTH,
  SLINGSHOT_HEIGHT,
  SLINGSHOT_RESTITUTION,
  SLINGSHOT_STUCK_FRAMES,
  SLINGSHOT_STUCK_VELOCITY,
  SLINGSHOT_TREMBLE_AMP,
  SLINGSHOT_TREMBLE_DURATION,
  SLINGSHOT_TREMBLE_FREQ,
  SLINGSHOT_UNSTICK_IMPULSE,
  SLINGSHOT_WIDTH,
} from "./slingshotConfig"

interface SlingshotProps {
  position: PositionType
  side: "left" | "right"
  slingshotId: number
}

const Slingshot = ({ position, side, slingshotId }: SlingshotProps) => {
  const rubberBodyRef = useRef<RapierRigidBody>(null)
  const rubberRef = useRef<THREE.Mesh>(null)
  const hitAt = useRef(-Infinity)
  const stuckBall = useRef<{ body: RapierRigidBody; frames: number } | null>(null)

  const xDir = side === "left" ? 1 : -1

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

  const rubberTransform = useMemo(() => {
    const len = Math.hypot(SLINGSHOT_WIDTH, SLINGSHOT_DEPTH)
    return {
      position: [(xDir * SLINGSHOT_WIDTH) / 2, SLINGSHOT_HEIGHT / 2, -SLINGSHOT_DEPTH / 2] as [
        number,
        number,
        number,
      ],
      rotationY: xDir * Math.atan2(SLINGSHOT_WIDTH, SLINGSHOT_DEPTH),
      length: len,
    }
  }, [xDir])

  const handleCollision = useCallback(
    ({ other }: CollisionEnterPayload) => {
      if (!rubberBodyRef.current || !other.rigidBody) return
      if (other.rigidBodyObject?.name !== "ball") return
      sendSlingshotHit(slingshotId)
      hitAt.current = performance.now() / 1000
      stuckBall.current = { body: other.rigidBody, frames: 0 }
    },
    [slingshotId],
  )

  useFrame(() => {
    if (rubberRef.current) {
      const t = performance.now() / 1000 - hitAt.current
      if (t < SLINGSHOT_TREMBLE_DURATION) {
        const decay = 1 - t / SLINGSHOT_TREMBLE_DURATION
        rubberRef.current.position.x =
          rubberTransform.position[0] +
          Math.sin(t * SLINGSHOT_TREMBLE_FREQ) * SLINGSHOT_TREMBLE_AMP * decay
      } else {
        rubberRef.current.position.x = rubberTransform.position[0]
      }
    }

    if (!stuckBall.current || !rubberBodyRef.current) return
    const ball = stuckBall.current.body
    const v = ball.linvel()
    if (Math.hypot(v.x, v.y, v.z) > SLINGSHOT_STUCK_VELOCITY) {
      stuckBall.current = null
      return
    }
    stuckBall.current.frames++
    if (stuckBall.current.frames >= SLINGSHOT_STUCK_FRAMES) {
      const a = Math.random() * Math.PI * 2
      const m = ball.mass()
      ball.applyImpulse(
        {
          x: Math.cos(a) * SLINGSHOT_UNSTICK_IMPULSE * m,
          y: 0,
          z: Math.sin(a) * SLINGSHOT_UNSTICK_IMPULSE * m,
        },
        true,
      )
      stuckBall.current = null
    }
  })

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
          <boxGeometry args={[0.08, SLINGSHOT_HEIGHT, rubberTransform.length]} />
          <meshStandardMaterial color="#d33" />
        </mesh>
      </RigidBody>
    </>
  )
}

export default Slingshot
