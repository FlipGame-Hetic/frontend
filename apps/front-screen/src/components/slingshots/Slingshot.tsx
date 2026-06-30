import type { PositionType } from "@/types/worldTypes"
import { playRandomSfx } from "@/audio/soundEngine"
import { broadcastEvent } from "@frontend/ws"
import { useFrame } from "@react-three/fiber"
import useScorePopupsStore from "@/stores/useScorePopupsStore"
import {
  CuboidCollider,
  MeshCollider,
  RigidBody,
  type CollisionEnterPayload,
  type RapierRigidBody,
} from "@react-three/rapier"
import { useCallback, useMemo, useRef } from "react"
import type { Group, Mesh } from "three"
import { createStuckBallTracker } from "../physics/collision/stuckBallTracker"
import {
  applyMassScaledImpulse,
  readBouncerBallCollision,
} from "../physics/collision/bouncerCollision"
import {
  SLINGSHOT_ACTIVE_FACE_POINTS,
  SLINGSHOT_FACE_HEIGHT,
  SLINGSHOT_FACE_OUTSET,
  SLINGSHOT_FACE_THICKNESS,
  SLINGSHOT_TREMBLE_AMP,
  SLINGSHOT_TREMBLE_DURATION,
  SLINGSHOT_TREMBLE_FREQ,
  SLINGSHOT_RESTITUTION,
  SLINGSHOT_IMPULSE_STRENGTH,
  SLINGSHOT_STUCK_FRAMES,
  SLINGSHOT_STUCK_VELOCITY,
  SLINGSHOT_UNSTICK_IMPULSE,
} from "./slingshotConfig"
import useScreenShakeStore from "@/stores/useScreenShakeStore"
import { SHAKE_INTENSITY } from "@/components/screenShake/screenShakeConfig"
import { emitParticleBurst } from "../vfx/particles/particleBurstQueue"

interface SlingshotProps {
  position: PositionType
  side: "left" | "right"
  moduleMesh: Mesh
  rubberMesh?: Mesh
}

const Slingshot = ({ position, side, moduleMesh, rubberMesh }: SlingshotProps) => {
  const bodyRef = useRef<RapierRigidBody>(null)
  const rubberGroupRef = useRef<Group>(null)
  const hitAt = useRef(-Infinity)
  const stuckTracker = useRef(
    createStuckBallTracker({
      stuckVelocity: SLINGSHOT_STUCK_VELOCITY,
      stuckFrames: SLINGSHOT_STUCK_FRAMES,
      unstick: (body, dir) => {
        applyMassScaledImpulse(body, dir, SLINGSHOT_UNSTICK_IMPULSE)
      },
    }),
  )

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
      const collision = readBouncerBallCollision(other, bodyRef.current)
      if (!collision) return

      const { ballBody, ballId, ballPosition, exitDirection } = collision
      broadcastEvent({ event_type: "BumperTriangle", payload: { ball_id: ballId } })
      playRandomSfx("slingshots")
      useScreenShakeStore.getState().addTrauma(SHAKE_INTENSITY.slingshot)
      hitAt.current = performance.now() / 1000

      useScorePopupsStore.getState().recordHit(ballPosition, ballId, "bumper")

      emitParticleBurst({
        kind: "slingshot",
        position: ballPosition,
        direction: {
          x: activeFace.normal.x,
          y: 0,
          z: activeFace.normal.z,
        },
      })

      if (exitDirection) {
        applyMassScaledImpulse(ballBody, exitDirection, SLINGSHOT_IMPULSE_STRENGTH)
      }

      stuckTracker.current.arm(ballBody)
    },
    [activeFace.normal.x, activeFace.normal.z],
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

    stuckTracker.current.tick()
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
        restitution={SLINGSHOT_RESTITUTION}
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
