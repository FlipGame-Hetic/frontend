import type { CollisionEnterPayload, RapierRigidBody } from "@react-three/rapier"
import { getBallId } from "../../balls/runtime/ballUserData"
import { normalizedPlayfieldDirection } from "../../playfield/playfieldConfig"
import type { Position3Type } from "@/types/worldTypes"

export interface BouncerBallCollision {
  ballBody: RapierRigidBody
  ballId: string
  ballPosition: Position3Type
  exitDirection: Position3Type | null
}

const copyVector = (value: Position3Type): Position3Type => ({
  x: value.x,
  y: value.y,
  z: value.z,
})

export const readBouncerBallCollision = (
  other: CollisionEnterPayload["other"],
  sourceBody: RapierRigidBody | null | undefined,
): BouncerBallCollision | null => {
  if (!sourceBody || !other.rigidBody) return null
  if (other.rigidBodyObject?.name !== "ball") return null

  const sourcePosition = sourceBody.translation()
  const ballPosition = other.rigidBody.translation()
  // Direction from the bouncer center to the ball, flattened onto the playfield so the kick stays in-plane
  const exitDirection = normalizedPlayfieldDirection({
    x: ballPosition.x - sourcePosition.x,
    y: ballPosition.y - sourcePosition.y,
    z: ballPosition.z - sourcePosition.z,
  })

  return {
    ballBody: other.rigidBody,
    ballId: getBallId(other.rigidBodyObject.userData) ?? "",
    ballPosition: copyVector(ballPosition),
    exitDirection: exitDirection ? copyVector(exitDirection) : null,
  }
}

// Scale the impulse by the ball mass so the resulting velocity kick is identical whatever the ball's mass
export const applyMassScaledImpulse = (
  body: RapierRigidBody,
  direction: Position3Type,
  impulseStrength: number,
): void => {
  const mass = body.mass()

  body.applyImpulse(
    {
      x: direction.x * impulseStrength * mass,
      y: direction.y * impulseStrength * mass,
      z: direction.z * impulseStrength * mass,
    },
    true,
  )
}
