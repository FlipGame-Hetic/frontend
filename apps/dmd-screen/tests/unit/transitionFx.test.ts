import { describe, it, expect } from "vitest"
import { fadeBuffer, glitchDissolve } from "@/dmd/transitionFx"
import { createSurface } from "@/dmd/buffer"

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

describe("glitchDissolve", () => {
  const noGlitch = () => 0.99 // above every random threshold → no tear/flash/dim

  it("shows the old snapshot for rows not yet flipped", () => {
    const s = createSurface(4, 3)
    s.buffer.fill(1) // new scene
    const fromBuffer = new Float32Array(12).fill(0.5) // old snapshot
    const fromColor = new Uint32Array(12).fill(0)
    const thresholds = new Float32Array([0.5, 0.5, 0.5])

    glitchDissolve(s, fromBuffer, fromColor, 0.1, thresholds, noGlitch)

    expect(Array.from(s.buffer).every((v) => Math.abs(v - 0.5) < 1e-6)).toBe(true)
  })

  it("keeps the new scene for rows already flipped", () => {
    const s = createSurface(4, 3)
    s.buffer.fill(1)
    const fromBuffer = new Float32Array(12).fill(0.5)
    const fromColor = new Uint32Array(12).fill(0)
    const thresholds = new Float32Array([0.5, 0.5, 0.5])

    glitchDissolve(s, fromBuffer, fromColor, 0.9, thresholds, noGlitch)

    expect(Array.from(s.buffer).every((v) => v === 1)).toBe(true)
  })
})
