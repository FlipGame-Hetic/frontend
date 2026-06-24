import type { RapierRigidBody } from "@react-three/rapier"
import { normalizedPlayfieldDirection } from "../playfieldPlane"

export interface StuckBallTracker {
  arm(body: RapierRigidBody): void
  tick(): void
}

// Detects a ball wedged near-motionless after a hit and nudges it free once it stays below 'stuckVelocity' for 'stuckFrames'
export const createStuckBallTracker = (opts: {
  stuckVelocity: number
  stuckFrames: number
  unstick: (body: RapierRigidBody, direction: { x: number; y: number; z: number }) => void
}): StuckBallTracker => {
  let state: { body: RapierRigidBody; frames: number } | null = null

  return {
    arm(body) {
      state = { body, frames: 0 }
    },
    tick() {
      if (!state) return
      const { body } = state
      const vel = body.linvel()
      // Still moving fast enough : not stuck, disarm
      if (Math.hypot(vel.x, vel.y, vel.z) > opts.stuckVelocity) {
        state = null
        return
      }
      state.frames++
      if (state.frames < opts.stuckFrames) return
      // Nudge out in a random in-plane direction so a repeatedly stuck ball doesn't always escape the same way
      const angle = Math.random() * Math.PI * 2
      const dir = normalizedPlayfieldDirection({ x: Math.cos(angle), y: 0, z: Math.sin(angle) })
      if (!dir) return
      opts.unstick(body, dir)
      state = null
    },
  }
}
