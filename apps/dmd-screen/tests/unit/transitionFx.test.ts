import { describe, it, expect } from "vitest"
import { fadeBuffer } from "@/dmd/transitionFx"

describe("fadeBuffer", () => {
  it("scales every brightness by the factor", () => {
    const b = new Float32Array([1, 0.5, 0.2])
    fadeBuffer(b, 0.5)
    expect(b[0]).toBeCloseTo(0.5)
    expect(b[1]).toBeCloseTo(0.25)
    expect(b[2]).toBeCloseTo(0.1)
  })

  it("clamps the factor to 0..1", () => {
    const dark = new Float32Array([1, 1])
    fadeBuffer(dark, -1)
    expect(dark[0]).toBe(0)

    const full = new Float32Array([0.4])
    fadeBuffer(full, 5)
    expect(full[0]).toBeCloseTo(0.4)
  })
})
