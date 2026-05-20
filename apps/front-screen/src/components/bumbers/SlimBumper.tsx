import type { PositionType } from "@/types/worldTypes"
import { broadcastEvent } from "@frontend/ws"
import { useFrame } from "@react-three/fiber"
import useGameStore from "@/stores/useGameStore"
import { BUMPER_SCORE } from "@/config/scoreConfig"
import type { RapierRigidBody } from "@react-three/rapier"
import { RigidBody, type CollisionEnterPayload } from "@react-three/rapier"
import { useControls } from "leva"
import { useCallback, useEffect, useRef } from "react"
import type { Mesh } from "three"
import { Vector3 } from "three"
import { normalizedPlayfieldDirection } from "../physics/playfieldPlane"
import {
  SLIM_BUMPER_BOUNCE_AMP,
  SLIM_BUMPER_BOUNCE_DURATION,
  SLIM_BUMPER_BOUNCE_FREQ,
  SLIM_BUMPER_IMPULSE_STRENGTH,
  SLIM_BUMPER_RESTITUTION,
  SLIM_BUMPER_STUCK_FRAMES,
  SLIM_BUMPER_STUCK_VELOCITY,
  SLIM_BUMPER_UNSTICK_IMPULSE,
} from "./slimBumperConfig"

interface SlimBumperProps {
  position: PositionType
  bumperId: number
  meshOverride: Mesh
}

const SlimBumper = ({ position, bumperId, meshOverride }: SlimBumperProps) => {
  const bodyRef = useRef<RapierRigidBody>(null)
  const hitAt = useRef(-Infinity)
  const baseScale = useRef(new Vector3())
  const stuckBall = useRef<{ body: RapierRigidBody; frames: number } | null>(null)

  useEffect(() => {
    baseScale.current.copy(meshOverride.scale)
  }, [meshOverride])

  const { restitution, impulseStrength, stuckFrames, stuckVelocity, unstickImpulse } = useControls(
    "SlimBumpers",
    {
      restitution: { value: SLIM_BUMPER_RESTITUTION, min: 0, max: 1.0, step: 0.05 },
      impulseStrength: { value: SLIM_BUMPER_IMPULSE_STRENGTH, min: 1, max: 30, step: 1 },
      stuckFrames: { value: SLIM_BUMPER_STUCK_FRAMES, min: 10, max: 120, step: 5 },
      stuckVelocity: { value: SLIM_BUMPER_STUCK_VELOCITY, min: 0.1, max: 2.0, step: 0.1 },
      unstickImpulse: { value: SLIM_BUMPER_UNSTICK_IMPULSE, min: 1, max: 20, step: 1 },
    },
  )

  const handleCollision = useCallback(
    ({ other }: CollisionEnterPayload) => {
      if (!bodyRef.current || !other.rigidBody) return
      if (other.rigidBodyObject?.name !== "ball") return

      broadcastEvent({ event_type: "bumper_hit", payload: { bumper_id: bumperId } })
      useGameStore.getState().addScore(BUMPER_SCORE)
      hitAt.current = performance.now() / 1000

      const bumperPos = bodyRef.current.translation()
      const ballPos = other.rigidBody.translation()
      const dir = normalizedPlayfieldDirection({
        x: ballPos.x - bumperPos.x,
        y: ballPos.y - bumperPos.y,
        z: ballPos.z - bumperPos.z,
      })

      if (!dir) return

      const ballMass = other.rigidBody.mass()
      other.rigidBody.applyImpulse(
        {
          x: dir.x * impulseStrength * ballMass,
          y: dir.y * impulseStrength * ballMass,
          z: dir.z * impulseStrength * ballMass,
        },
        true,
      )

      stuckBall.current = { body: other.rigidBody, frames: 0 }
    },
    [impulseStrength, bumperId],
  )

  useFrame(() => {
    const t = performance.now() / 1000 - hitAt.current
    if (t < SLIM_BUMPER_BOUNCE_DURATION) {
      const decay = 1 - t / SLIM_BUMPER_BOUNCE_DURATION
      const s = 1 + Math.sin(t * SLIM_BUMPER_BOUNCE_FREQ) * SLIM_BUMPER_BOUNCE_AMP * decay
      meshOverride.scale.set(
        baseScale.current.x * s,
        baseScale.current.y * s,
        baseScale.current.z * s,
      )
    } else if (t < SLIM_BUMPER_BOUNCE_DURATION + 0.1) {
      meshOverride.scale.copy(baseScale.current)
    }

    if (!stuckBall.current || !bodyRef.current) return
    const ball = stuckBall.current.body
    const vel = ball.linvel()
    if (Math.hypot(vel.x, vel.y, vel.z) > stuckVelocity) {
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
      <primitive object={meshOverride} />
    </RigidBody>
  )
}

export default SlimBumper
