import { describe, it, expect } from "vitest"
import { Pulse } from "@/dmd/pulse"
import { linear } from "@/dmd/ease"

describe("Pulse", () => {
  it("is idle (0) until triggered", () => {
    const p = new Pulse(100)
    expect(p.value).toBe(0)
    expect(p.active).toBe(false)
  })

  it("peaks at 1 on trigger and decays to 0", () => {
    const p = new Pulse(100, linear)
    p.trigger()
    expect(p.value).toBeCloseTo(1)
    expect(p.active).toBe(true)
    p.advance(50)
    expect(p.value).toBeCloseTo(0.5)
    p.advance(50)
    expect(p.value).toBe(0)
    expect(p.active).toBe(false)
  })
})
