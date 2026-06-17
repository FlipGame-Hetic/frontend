import type { PositionType } from "@/types/worldTypes"
import { playRandomSfx } from "@/audio/soundEngine"
import { broadcastEvent } from "@frontend/ws"
import { useFrame } from "@react-three/fiber"
import useScorePopupsStore from "@/stores/useScorePopupsStore"
import type { RapierRigidBody } from "@react-three/rapier"
import { RigidBody, type CollisionEnterPayload } from "@react-three/rapier"
import { useCallback, useRef } from "react"
import type { Group, Mesh } from "three"
import { normalizedPlayfieldDirection } from "../physics/playfieldPlane"
import { createStuckBallTracker } from "../physics/stuckBallTracker"
import { applyBumperImpulse, shouldSkipBumperHit } from "./bumperCollision"
import { getBallId } from "../balls/ballUserData"
import {
  BUMPER_SCALE_FACTOR,
  BUMPER_SIZE_ARGS,
  BUMPER_RESTITUTION,
  BUMPER_IMPULSE_STRENGTH,
  BUMPER_STUCK_FRAMES,
  BUMPER_STUCK_VELOCITY,
  BUMPER_UNSTICK_IMPULSE,
} from "./bumperConfig"
import { BALL_MIN_NORMAL_SPEED, BALL_MAX_NORMAL_SPEED } from "../balls/ballConfig"
import useScreenShakeStore from "@/stores/useScreenShakeStore"
import { SHAKE_INTENSITY } from "@/components/screenShake/screenShakeConfig"

interface BumperProps {
  position: PositionType
  bumperId: number
  meshOverride?: Mesh
  rubberMesh?: Mesh
  onBonusHit?: (ballId: string) => void
}

const Bumper = ({
  position,
  bumperId: _bumperId,
  meshOverride,
  rubberMesh,
  onBonusHit,
}: BumperProps) => {
  const bodyRef = useRef<RapierRigidBody>(null)
  const meshRef = useRef<Mesh>(null)
  const rubberGroupRef = useRef<Group>(null)
  const isBouncing = useRef(false)
  const stuckTracker = useRef(
    createStuckBallTracker({
      stuckVelocity: BUMPER_STUCK_VELOCITY,
      stuckFrames: BUMPER_STUCK_FRAMES,
      unstick: (body, dir) => {
        applyBumperImpulse(
          body,
          dir,
          BUMPER_UNSTICK_IMPULSE,
          BALL_MIN_NORMAL_SPEED,
          BALL_MAX_NORMAL_SPEED,
        )
      },
    }),
  )

  const handleCollision = useCallback(
    ({ other }: CollisionEnterPayload) => {
      isBouncing.current = true
      setTimeout(() => {
        isBouncing.current = false
      }, 150)

      if (!bodyRef.current || !other.rigidBody) return
      if (other.rigidBodyObject?.name !== "ball") return
      if (shouldSkipBumperHit(other.rigidBody)) return

      const ballId = getBallId(other.rigidBodyObject.userData) ?? ""
      broadcastEvent({ event_type: "Bumper", payload: { ball_id: ballId } })
      if (ballId) onBonusHit?.(ballId)
      playRandomSfx("bumpers")
      useScreenShakeStore.getState().addTrauma(SHAKE_INTENSITY.bumper)

      const bumperPos = bodyRef.current.translation()
      const ballPos = other.rigidBody.translation()
      useScorePopupsStore
        .getState()
        .recordHit({ x: ballPos.x, y: ballPos.y, z: ballPos.z }, ballId, "bumper")

      const dir = normalizedPlayfieldDirection({
        x: ballPos.x - bumperPos.x,
        y: ballPos.y - bumperPos.y,
        z: ballPos.z - bumperPos.z,
      })

      if (!dir) return

      applyBumperImpulse(
        other.rigidBody,
        dir,
        BUMPER_IMPULSE_STRENGTH,
        BALL_MIN_NORMAL_SPEED,
        BALL_MAX_NORMAL_SPEED,
      )

      stuckTracker.current.arm(other.rigidBody)
    },
    [onBonusHit],
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

    stuckTracker.current.tick()
  })

  return (
    <RigidBody
      ref={bodyRef}
      type="fixed"
      colliders="hull"
      position={position}
      onCollisionEnter={handleCollision}
      restitution={BUMPER_RESTITUTION}
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
