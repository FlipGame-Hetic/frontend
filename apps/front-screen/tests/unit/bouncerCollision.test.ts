import { describe, expect, it, vi } from "vitest"
import {
  applyMassScaledImpulse,
  readBouncerBallCollision,
} from "@/components/physics/collision/bouncerCollision"

const makeBody = (position: { x: number; y: number; z: number }, mass = 1) => ({
  translation: () => position,
  mass: () => mass,
  applyImpulse: vi.fn(),
})

describe("readBouncerBallCollision", () => {
  it("reads ball id, ball position and exit direction from a ball collision", () => {
    const sourceBody = makeBody({ x: 0, y: 0, z: 0 })
    const ballBody = makeBody({ x: 1, y: 0, z: 0 })

    const collision = readBouncerBallCollision(
      {
        rigidBody: ballBody,
        rigidBodyObject: { name: "ball", userData: { ballId: "ball-7" } },
      } as never,
      sourceBody as never,
    )

    expect(collision?.ballBody).toBe(ballBody)
    expect(collision?.ballId).toBe("ball-7")
    expect(collision?.ballPosition).toEqual({ x: 1, y: 0, z: 0 })
    expect(collision?.exitDirection).toEqual({ x: 1, y: 0, z: 0 })
  })

  it("returns null for non-ball collisions", () => {
    const collision = readBouncerBallCollision(
      {
        rigidBody: makeBody({ x: 1, y: 0, z: 0 }),
        rigidBodyObject: { name: "wall", userData: {} },
      } as never,
      makeBody({ x: 0, y: 0, z: 0 }) as never,
    )

    expect(collision).toBeNull()
  })
})

describe("applyMassScaledImpulse", () => {
  it("applies an impulse scaled by body mass", () => {
    const body = makeBody({ x: 0, y: 0, z: 0 }, 3)

    applyMassScaledImpulse(body as never, { x: 1, y: 0.5, z: -1 }, 2)

    expect(body.applyImpulse).toHaveBeenCalledWith({ x: 6, y: 3, z: -6 }, true)
  })
})
