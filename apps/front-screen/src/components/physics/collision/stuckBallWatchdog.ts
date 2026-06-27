import { normalizedPlayfieldDirection } from "@/components/playfield/playfieldConfig"
import type { RapierRigidBody } from "@react-three/rapier"
import type { Vector3Like } from "three"

export interface StuckBallWatchdog {
  tick(body: RapierRigidBody): void
  reset(): void
}

// Per-ball safety net that nudges a wedged ball and teleports it once every nudge has failed to free it
export const createStuckBallWatchdog = (opts: {
  stuckVelocity: number
  framesBeforeAttempt: number
  restuckFrames: number
  observeFrames: number
  maxImpulseAttempts: number
  applyImpulse: (body: RapierRigidBody, direction: Vector3Like) => void
  teleport: (body: RapierRigidBody) => void
  // Checked right before each nudge or teleport : true leaves a legitimately resting ball (cradle, stack) alone
  isSuppressed?: () => boolean
}): StuckBallWatchdog => {
  // Consecutive low-speed frames : the shared "stuck right now" counter
  let lowFrames = 0
  // Nudges spent since the ball was last considered free
  let attempts = 0
  // Frames since the last nudge : how far into the observation window we are
  let sinceAttempt = 0

  const reset = () => {
    lowFrames = 0
    attempts = 0
    sinceAttempt = 0
  }

  // Nudge once more, or teleport once every nudge has been used up
  const escalate = (body: RapierRigidBody) => {
    // A ball that is resting on purpose is left alone, and the escalation is dropped rather than retried every frame
    if (opts.isSuppressed?.()) {
      reset()
      return
    }
    lowFrames = 0
    if (attempts >= opts.maxImpulseAttempts) {
      opts.teleport(body)
      reset()
      return
    }
    // Random in-plane direction so a repeatedly stuck ball doesn't always escape the same way
    const angle = Math.random() * Math.PI * 2
    const dir = normalizedPlayfieldDirection({ x: Math.cos(angle), y: 0, z: Math.sin(angle) })
    if (!dir) return
    opts.applyImpulse(body, dir)
    attempts++
    sinceAttempt = 0
  }

  return {
    reset,
    tick(body) {
      const vel = body.linvel()
      lowFrames = Math.hypot(vel.x, vel.y, vel.z) <= opts.stuckVelocity ? lowFrames + 1 : 0

      // No attempt in flight : wait for the initial stuck confirmation
      if (attempts === 0) {
        if (lowFrames >= opts.framesBeforeAttempt) escalate(body)
        return
      }

      // Observation window after a nudge : a fresh re-stick fails the attempt, surviving the window frees the ball
      sinceAttempt++
      if (lowFrames >= opts.restuckFrames) {
        escalate(body)
        return
      }
      if (sinceAttempt >= opts.observeFrames) reset()
    },
  }
}
