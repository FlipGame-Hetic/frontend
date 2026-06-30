import type { RapierRigidBody } from "@react-three/rapier"
import { clampBallVelocityToPlayfield } from "../playfield/playfieldConfig"
import { BUMPER_HIT_DEBOUNCE_MS, BUMPER_MAX_EXIT_TANGENT_SPEED } from "./bumperConfig"

const lastHitByBall = new WeakMap<RapierRigidBody, number>()

export const shouldSkipBumperHit = (ball: RapierRigidBody): boolean => {
  const now = performance.now()
  const lastHit = lastHitByBall.get(ball)

  if (lastHit !== undefined && now - lastHit < BUMPER_HIT_DEBOUNCE_MS) {
    return true
  }

  lastHitByBall.set(ball, now)
  return false
}

export const applyBumperImpulse = (
  ball: RapierRigidBody,
  direction: { x: number; y: number; z: number },
  impulseStrength: number,
  minNormalSpeed: number,
  maxNormalSpeed: number,
) => {
  const ballMass = ball.mass()
  const impulseMag = impulseStrength * ballMass

  ball.setLinvel(
    clampBallVelocityToPlayfield(
      ball.linvel(),
      BUMPER_MAX_EXIT_TANGENT_SPEED,
      minNormalSpeed,
      maxNormalSpeed,
    ),
    true,
  )

  ball.applyImpulse(
    { x: direction.x * impulseMag, y: direction.y * impulseMag, z: direction.z * impulseMag },
    true,
  )

  ball.setLinvel(
    clampBallVelocityToPlayfield(
      ball.linvel(),
      BUMPER_MAX_EXIT_TANGENT_SPEED,
      minNormalSpeed,
      maxNormalSpeed,
    ),
    true,
  )
}
