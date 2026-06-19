import { describe, it, expect } from "vitest"
import { blink } from "@/dmd/anim"

describe("blink", () => {
  it("is on for the first half-period and off for the second", () => {
    expect(blink(0, 500)).toBe(true)
    expect(blink(499, 500)).toBe(true)
    expect(blink(500, 500)).toBe(false)
    expect(blink(999, 500)).toBe(false)
    expect(blink(1000, 500)).toBe(true)
  })

  it("respects the period length", () => {
    expect(blink(349, 350)).toBe(true)
    expect(blink(350, 350)).toBe(false)
  })
})
