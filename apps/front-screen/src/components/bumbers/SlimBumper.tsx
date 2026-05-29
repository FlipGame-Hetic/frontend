import type { PositionType } from "@/types/worldTypes"
import { broadcastEvent } from "@frontend/ws"
import { useFrame } from "@react-three/fiber"
import useGameStore from "@/stores/useGameStore"
import useScorePopupsStore from "@/stores/useScorePopupsStore"
import { playRandomSfx, playSfx } from "@/audio/soundEngine"
import { BUMPER_SCORE } from "@/config/scoreConfig"
import type { RapierRigidBody } from "@react-three/rapier"
import { RigidBody, type CollisionEnterPayload } from "@react-three/rapier"
import { useCallback, useEffect, useRef } from "react"
import type { Mesh } from "three"
import { Vector3 } from "three"
import { normalizedPlayfieldDirection } from "../physics/playfieldPlane"
import { applyBumperImpulse, shouldSkipBumperHit } from "./bumperCollision"
import {
  SLIM_BUMPER_BOUNCE_AMP,
  SLIM_BUMPER_BOUNCE_DURATION,
  SLIM_BUMPER_BOUNCE_FREQ,
  SLIM_BUMPER_RESTITUTION,
  SLIM_BUMPER_IMPULSE_STRENGTH,
  SLIM_BUMPER_STUCK_FRAMES,
  SLIM_BUMPER_STUCK_VELOCITY,
  SLIM_BUMPER_UNSTICK_IMPULSE,
} from "./slimBumperConfig"
import { BALL_MIN_NORMAL_SPEED, BALL_MAX_NORMAL_SPEED } from "../balls/ballConfig"
import useScreenShakeStore from "@/stores/useScreenShakeStore"
import { SHAKE_INTENSITY } from "@/components/screenShake/shakeIntensity"

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

  const handleCollision = useCallback(
    ({ other }: CollisionEnterPayload) => {
      if (!bodyRef.current || !other.rigidBody) return
      if (other.rigidBodyObject?.name !== "ball") return
      if (shouldSkipBumperHit(other.rigidBody)) return

      broadcastEvent({ event_type: "bumper_hit", payload: { bumper_id: bumperId } })
      useGameStore.getState().addScore(BUMPER_SCORE)
      playRandomSfx("bumpers")
      playSfx("score_event")
      useScreenShakeStore.getState().addTrauma(SHAKE_INTENSITY.slimBumper)
      hitAt.current = performance.now() / 1000

      const bumperPos = bodyRef.current.translation()
      const ballPos = other.rigidBody.translation()
      useScorePopupsStore
        .getState()
        .addPopup(BUMPER_SCORE, { x: ballPos.x, y: ballPos.y, z: ballPos.z })
      const dir = normalizedPlayfieldDirection({
        x: ballPos.x - bumperPos.x,
        y: ballPos.y - bumperPos.y,
        z: ballPos.z - bumperPos.z,
      })

      if (!dir) return

      applyBumperImpulse(
        other.rigidBody,
        dir,
        SLIM_BUMPER_IMPULSE_STRENGTH,
        BALL_MIN_NORMAL_SPEED,
        BALL_MAX_NORMAL_SPEED,
      )

      stuckBall.current = { body: other.rigidBody, frames: 0 }
    },
    [bumperId],
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
    if (Math.hypot(vel.x, vel.y, vel.z) > SLIM_BUMPER_STUCK_VELOCITY) {
      stuckBall.current = null
      return
    }
    stuckBall.current.frames++
    if (stuckBall.current.frames >= SLIM_BUMPER_STUCK_FRAMES) {
      const angle = Math.random() * Math.PI * 2
      const dir = normalizedPlayfieldDirection({ x: Math.cos(angle), y: 0, z: Math.sin(angle) })
      if (!dir) return

      applyBumperImpulse(
        ball,
        dir,
        SLIM_BUMPER_UNSTICK_IMPULSE,
        BALL_MIN_NORMAL_SPEED,
        BALL_MAX_NORMAL_SPEED,
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
      restitution={SLIM_BUMPER_RESTITUTION}
    >
      <primitive object={meshOverride} />
    </RigidBody>
  )
}

export default SlimBumper
