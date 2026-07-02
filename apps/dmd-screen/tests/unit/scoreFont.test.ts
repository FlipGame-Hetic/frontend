import { describe, it, expect } from "vitest"
import { createSurface } from "@/dmd/buffer"
import { measureScore, drawScore, fitScore } from "@/dmd/scoreFont"

describe("scoreFont", () => {
  it("measureScore matches glyph geometry", () => {
    expect(measureScore("", 3, 2)).toBe(0)
    expect(measureScore("1", 3, 2)).toBe(15) // 1 glyph * 5 * scale 3
    expect(measureScore("12", 2, 1)).toBe(21) // 2*5*2 + 1 spacing
  })

  it("fitScore picks a size that never overflows maxWidth", () => {
    const fit = fitScore("000.000", 118)
    expect(fit.fits).toBe(true)
    expect(measureScore("000.000", fit.scale, fit.spacing)).toBeLessThanOrEqual(118)
  })

  it("fitScore prefers a larger scale when there is room", () => {
    expect(fitScore("000.000", 118).scale).toBe(3)
    // A million (9 chars) no longer fits at scale 3, so it steps down but still fits.
    const big = fitScore("1.000.000", 118)
    expect(big.scale).toBe(2)
    expect(big.fits).toBe(true)
  })

  it("caps the scale at maxScale even when a larger size would fit", () => {
    // "000.000" fits at scale 3, but the game-over score wants it a step smaller.
    expect(fitScore("000.000", 118).scale).toBe(3)
    const capped = fitScore("000.000", 118, 2)
    expect(capped.scale).toBe(2)
    expect(capped.fits).toBe(true)
  })

  it("reports fits=false when even the smallest size overflows", () => {
    expect(fitScore("0.000.000.000.000", 40).fits).toBe(false)
  })

  it("drawScore lights the expected pixels for a digit", () => {
    const s = createSurface(64, 32)
    drawScore(s, "1", 0, 0, 1, 1.0, 1)
    // '1' top row bitmap is 0b00100 -> column 2 lit, plus the bold smear at column 3.
    expect(s.buffer[0]).toBe(0)
    expect(s.buffer[1]).toBe(0)
    expect(s.buffer[2]).toBeCloseTo(1)
    expect(s.buffer[3]).toBeCloseTo(1)
  })
})
