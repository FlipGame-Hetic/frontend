import { describe, it, expect } from "vitest"
import { createSurface } from "@/dmd/buffer"
import { drawCorners } from "@/dmd/frame"
import { isColorSet, unpackRgb } from "@/dmd/palette"

const COLS = 16
const ROWS = 8

describe("drawCorners", () => {
  it("lights the three outermost dots of each corner at the given brightness", () => {
    const s = createSurface(COLS, ROWS)
    drawCorners(s)
    expect(s.buffer[0]).toBeCloseTo(0.3)
    expect(s.buffer[2]).toBeCloseTo(0.3)
    expect(s.buffer[COLS - 1]).toBeCloseTo(0.3)
    expect(s.buffer[(ROWS - 1) * COLS]).toBeCloseTo(0.3)
    expect(s.buffer[ROWS * COLS - 1]).toBeCloseTo(0.3)
  })

  it("leaves the interior untouched", () => {
    const s = createSurface(COLS, ROWS)
    drawCorners(s)
    expect(s.buffer[3 * COLS + 8]).toBe(0)
  })

  it("applies a color to the corner dots when given", () => {
    const s = createSurface(COLS, ROWS)
    drawCorners(s, 0.3, "pink")
    const colorCell = s.color[0] ?? 0
    expect(isColorSet(colorCell)).toBe(true)
    expect(unpackRgb(colorCell)).toEqual([0xff, 0x2d, 0x6b])
  })
})
