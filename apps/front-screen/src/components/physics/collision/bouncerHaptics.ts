import type { BallHitType } from "@frontend/types"
import { broadcastEvent } from "@frontend/ws"
import type { RapierRigidBody } from "@react-three/rapier"
import type { PositionType } from "@/types/worldTypes"
import { projectOnPlayfield } from "@/components/playfield/playfieldConfig"

const HAPTIC_MAX_BALL_SPEED = 28

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, 0), 1)
}

const normalizeBouncerHitForce = (
  velocity: { x: number; y: number; z: number },
  maxSpeed = HAPTIC_MAX_BALL_SPEED,
): number => {
  const tangentVelocity = projectOnPlayfield(velocity)
  const speed = Math.hypot(tangentVelocity.x, tangentVelocity.y, tangentVelocity.z)
  return clamp01(speed / maxSpeed)
}

export const broadcastBouncerHit = ({
  id,
  type,
  position,
  ballBody,
}: {
  id: string
  type: BallHitType
  position: PositionType
  ballBody: RapierRigidBody
}): void => {
  broadcastEvent({
    event_type: "BallHit",
    payload: {
      hits: [
        {
          id,
          type,
          force: normalizeBouncerHitForce(ballBody.linvel()),
          position: { x: position[0], z: position[2] },
        },
      ],
    },
  })
}
