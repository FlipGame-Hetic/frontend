import { describe, it, expect } from "vitest"
import { createSurface, setPixel } from "@/dmd/buffer"
import { isColorSet, unpackRgb } from "@/dmd/palette"

const COLS = 16
const ROWS = 8

describe("setPixel", () => {
  it("writes brightness at the right index", () => {
    const s = createSurface(COLS, ROWS)
    setPixel(s, 2, 1, 0.7)
    expect(s.buffer[1 * COLS + 2]).toBeCloseTo(0.7)
  })

  it("leaves the color cell unset when no color is given", () => {
    const s = createSurface(COLS, ROWS)
    setPixel(s, 2, 1, 1.0)
    expect(isColorSet(s.color[1 * COLS + 2] ?? 0)).toBe(false)
  })

  it("writes a resolved color when one is given", () => {
    const s = createSurface(COLS, ROWS)
    setPixel(s, 0, 0, 1.0, "cyan")
    const colorCell = s.color[0] ?? 0
    expect(isColorSet(colorCell)).toBe(true)
    expect(unpackRgb(colorCell)).toEqual([0x00, 0xf0, 0xff])
  })

  it("resets the color cell to default when a later write omits color", () => {
    const s = createSurface(COLS, ROWS)
    setPixel(s, 0, 0, 1.0, "cyan")
    setPixel(s, 0, 0, 0.5)
    expect(isColorSet(s.color[0] ?? 0)).toBe(false)
    expect(s.buffer[0]).toBeCloseTo(0.5)
  })

  it("ignores out-of-bounds writes", () => {
    const s = createSurface(COLS, ROWS)
    expect(() => {
      setPixel(s, -1, 0, 1.0)
      setPixel(s, COLS, 0, 1.0)
      setPixel(s, 0, ROWS, 1.0)
    }).not.toThrow()
  })
})
