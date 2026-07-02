import { describe, it, expect } from "vitest"
import { createSurface } from "@/dmd/buffer"
import { drawHeart, drawHearts } from "@/dmd/icons"
import { HEART_SPACING } from "@/dmd/constants"
import { isColorSet, unpackRgb } from "@/dmd/palette"

const COLS = 64

function makeSurface() {
  return createSurface(COLS, 32)
}

describe("drawHeart", () => {
  it("sets pixels only on the known bitmap shape", () => {
    const s = makeSurface()
    drawHeart(s, 0, 0, 1.0)
    expect(s.buffer[0]).toBe(0)
    expect(s.buffer[1]).toBe(1)
    expect(s.buffer[2]).toBe(0)
    expect(s.buffer[3]).toBe(1)
    expect(s.buffer[4]).toBe(0)
    const row1 = COLS
    expect(s.buffer[row1]).toBe(1)
    expect(s.buffer[row1 + 1]).toBe(1)
    expect(s.buffer[row1 + 4]).toBe(1)
  })

  it("applies x/y offset correctly", () => {
    const s = makeSurface()
    drawHeart(s, 10, 5, 0.5)
    expect(s.buffer[5 * COLS + 11]).toBe(0.5)
    expect(s.buffer[5 * COLS + 10]).toBe(0)
  })

  it("respects brightness parameter", () => {
    const s = makeSurface()
    drawHeart(s, 0, 0, 0.3)
    expect(s.buffer[1]).toBeCloseTo(0.3)
  })

  it("applies a color when given", () => {
    const s = makeSurface()
    drawHeart(s, 0, 0, 1.0, "red")
    const colorCell = s.color[1] ?? 0
    expect(isColorSet(colorCell)).toBe(true)
    expect(unpackRgb(colorCell)).toEqual([0xff, 0x31, 0x31])
  })

  it("silently ignores out-of-bounds writes", () => {
    const s = makeSurface()
    expect(() => {
      drawHeart(s, COLS - 1, 0, 1.0)
    }).not.toThrow()
  })
})

describe("drawHearts", () => {
  it("fills first filledCount hearts at brightness", () => {
    const s = makeSurface()
    drawHearts(s, 0, 0, 2, 3)
    const heart2col1 = HEART_SPACING * 2 + 1
    expect(s.buffer[heart2col1]).toBeCloseTo(0.15)
  })

  it("with filledCount=0 renders all hearts at dimBrightness", () => {
    const s = makeSurface()
    drawHearts(s, 0, 0, 0, 3, 1.0, 0.2)
    expect(s.buffer[1]).toBeCloseTo(0.2)
  })

  it("with filledCount=maxCount renders all hearts at brightness", () => {
    const s = makeSurface()
    drawHearts(s, 0, 0, 3, 3, 0.8, 0.1)
    const heart2row1 = COLS + HEART_SPACING * 2
    expect(s.buffer[heart2row1]).toBeCloseTo(0.8)
  })

  it("with filledCount > maxCount does not go out of bounds", () => {
    const s = makeSurface()
    expect(() => {
      drawHearts(s, 0, 0, 10, 3)
    }).not.toThrow()
  })
})
