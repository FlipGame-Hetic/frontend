import { describe, expect, it } from "vitest"
import {
  clampBallVelocityToPlayfield,
  dotPlayfieldNormal,
  normalizedPlayfieldDirection,
  projectOnPlayfield,
} from "@/components/physics/playfieldPlane"

function tangentSpeed(velocity: { x: number; y: number; z: number }) {
  const tangent = projectOnPlayfield(velocity)
  return Math.hypot(tangent.x, tangent.y, tangent.z)
}

describe("clampBallVelocityToPlayfield", () => {
  it("projects down-playfield motion onto a descending world-y direction", () => {
    const direction = normalizedPlayfieldDirection({ x: 0, y: 0, z: 1 })

    if (direction === null) {
      throw new Error("Expected a valid playfield direction")
    }
    expect(direction.y).toBeLessThan(0)
    expect(dotPlayfieldNormal(direction)).toBeCloseTo(0)
  })

  it("clamps excessive tangent speed", () => {
    const clamped = clampBallVelocityToPlayfield({ x: 30, y: 0, z: 40 }, 5, -4, 0)

    expect(tangentSpeed(clamped)).toBeCloseTo(5)
  })

  it("removes positive playfield-normal velocity", () => {
    const clamped = clampBallVelocityToPlayfield({ x: 1, y: 3, z: 2 }, 10, -4, 0)

    expect(dotPlayfieldNormal(clamped)).toBeCloseTo(0)
  })

  it("preserves negative playfield-normal velocity within the configured limit", () => {
    expect(clampBallVelocityToPlayfield({ x: 1, y: -3, z: 2 }, 10, -4, 0)).toEqual({
      x: 1,
      y: -3,
      z: 2,
    })
  })

  it("clamps negative playfield-normal velocity to the configured minimum", () => {
    const clamped = clampBallVelocityToPlayfield({ x: 1, y: -9, z: 2 }, 10, -4, 0)

    expect(dotPlayfieldNormal(clamped)).toBeCloseTo(-4)
  })
})
