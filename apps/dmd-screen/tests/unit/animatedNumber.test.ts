import { describe, it, expect } from "vitest"
import { AnimatedNumber } from "@/dmd/animatedNumber"
import { linear } from "@/dmd/ease"

describe("AnimatedNumber", () => {
  it("starts settled at its initial value", () => {
    expect(new AnimatedNumber(42).value).toBe(42)
  })

  it("eases toward a new target and reaches it exactly", () => {
    const n = new AnimatedNumber(0, 100, linear)
    n.setTarget(100)
    n.advance(50)
    expect(n.value).toBeCloseTo(50)
    n.advance(50)
    expect(n.value).toBe(100)
    n.advance(50)
    expect(n.value).toBe(100)
  })

  it("handles a decreasing target (e.g. tilt penalty)", () => {
    const n = new AnimatedNumber(100, 100, linear)
    n.setTarget(0)
    n.advance(50)
    expect(n.value).toBeCloseTo(50)
    n.advance(50)
    expect(n.value).toBe(0)
  })
})
