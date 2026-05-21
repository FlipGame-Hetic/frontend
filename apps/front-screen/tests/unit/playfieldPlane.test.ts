import { describe, expect, it } from "vitest"
import { clampBallVelocityToPlayfield } from "@/components/physics/playfieldPlane"

describe("clampBallVelocityToPlayfield", () => {
  it("clamps excessive tangent speed", () => {
    expect(clampBallVelocityToPlayfield({ x: 30, y: 0, z: 40 }, 5, -4, 0)).toEqual({
      x: 3,
      y: 0,
      z: 4,
    })
  })

  it("removes positive vertical velocity", () => {
    expect(clampBallVelocityToPlayfield({ x: 1, y: 3, z: 2 }, 10, -4, 0)).toEqual({
      x: 1,
      y: 0,
      z: 2,
    })
  })

  it("preserves negative vertical velocity within the configured limit", () => {
    expect(clampBallVelocityToPlayfield({ x: 1, y: -3, z: 2 }, 10, -4, 0)).toEqual({
      x: 1,
      y: -3,
      z: 2,
    })
  })

  it("clamps negative vertical velocity to the configured minimum", () => {
    expect(clampBallVelocityToPlayfield({ x: 1, y: -9, z: 2 }, 10, -4, 0)).toEqual({
      x: 1,
      y: -4,
      z: 2,
    })
  })
})
