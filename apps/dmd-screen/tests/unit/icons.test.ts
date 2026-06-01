import { describe, it, expect } from "vitest"
import { createBuffer } from "@/dmd/buffer"
import { drawHeart, drawHearts } from "@/dmd/icons"
import { HEART_SPACING } from "@/dmd/constants"

const COLS = 64

function makeBuffer() {
  return createBuffer(COLS, 32)
}

describe("drawHeart", () => {
  it("sets pixels only on the known bitmap shape", () => {
    const buf = makeBuffer()
    drawHeart(buf, COLS, 0, 0, 1.0)
    // Row 0: 0b01010 → cols 1 and 3 lit
    expect(buf[0]).toBe(0) // col 0
    expect(buf[1]).toBe(1) // col 1
    expect(buf[2]).toBe(0) // col 2
    expect(buf[3]).toBe(1) // col 3
    expect(buf[4]).toBe(0) // col 4
    // Row 1: 0b11111 → all 5 lit
    const row1 = COLS
    expect(buf[row1]).toBe(1)
    expect(buf[row1 + 1]).toBe(1)
    expect(buf[row1 + 4]).toBe(1)
  })

  it("applies x/y offset correctly", () => {
    const buf = makeBuffer()
    drawHeart(buf, COLS, 10, 5, 0.5)
    // Row 5, col 11 should be lit (row0 of bitmap: bit 4-1=col 1)
    expect(buf[5 * COLS + 11]).toBe(0.5)
    // Row 5, col 10 should not (bit 4)
    expect(buf[5 * COLS + 10]).toBe(0)
  })

  it("respects brightness parameter", () => {
    const buf = makeBuffer()
    drawHeart(buf, COLS, 0, 0, 0.3)
    // Row 0, col 1 should have brightness 0.3
    expect(buf[1]).toBeCloseTo(0.3)
  })

  it("silently ignores out-of-bounds writes", () => {
    const buf = makeBuffer()
    // Draw at right edge — should not throw
    expect(() => {
      drawHeart(buf, COLS, COLS - 1, 0, 1.0)
    }).not.toThrow()
  })
})

describe("drawHearts", () => {
  it("fills first filledCount hearts at brightness", () => {
    const buf = makeBuffer()
    drawHearts(buf, COLS, 0, 0, 2, 3)
    // Heart 0 and 1 at x=0 and x=HEART_SPACING should have bright pixels
    // Heart 2 at x=HEART_SPACING*2 should be dim
    const heart2col1 = HEART_SPACING * 2 + 1 // row0, col1 of third heart
    expect(buf[heart2col1]).toBeCloseTo(0.15) // dim default
  })

  it("with filledCount=0 renders all hearts at dimBrightness", () => {
    const buf = makeBuffer()
    drawHearts(buf, COLS, 0, 0, 0, 3, 1.0, 0.2)
    // Heart 0, row0, col1 should be at dimBrightness
    expect(buf[1]).toBeCloseTo(0.2)
  })

  it("with filledCount=maxCount renders all hearts at brightness", () => {
    const buf = makeBuffer()
    drawHearts(buf, COLS, 0, 0, 3, 3, 0.8, 0.1)
    // Third heart (x = HEART_SPACING * 2), row 1 (all bits set) col 0
    const heart2row1 = COLS + HEART_SPACING * 2
    expect(buf[heart2row1]).toBeCloseTo(0.8)
  })

  it("with filledCount > maxCount does not go out of bounds", () => {
    const buf = makeBuffer()
    expect(() => {
      drawHearts(buf, COLS, 0, 0, 10, 3)
    }).not.toThrow()
  })
})
