import { describe, expect, it } from "vitest"
import { createSurface } from "@/dmd/buffer"
import { drawString, drawStringCentered, drawStringScaledCentered, measureString } from "@/dmd/font"
import { isColorSet, unpackRgb } from "@/dmd/palette"

describe("measureString", () => {
  it("measures 5px glyphs with configurable spacing", () => {
    expect(measureString("")).toBe(0)
    expect(measureString("A")).toBe(5)
    expect(measureString("AB")).toBe(11)
    expect(measureString("AB", 2)).toBe(12)
  })
})

describe("drawString", () => {
  it("draws the known bitmap pixels for a character", () => {
    const s = createSurface(16, 8)

    drawString(s, "A", 0, 0)

    expect(s.buffer[0]).toBe(0)
    expect(s.buffer[1]).toBe(1)
    expect(s.buffer[2]).toBe(1)
    expect(s.buffer[3]).toBe(1)
    expect(s.buffer[4]).toBe(0)
  })

  it("applies an explicit color to text pixels", () => {
    const s = createSurface(16, 8)

    drawString(s, "A", 0, 0, 1, 0.8, "yellow")

    expect(s.buffer[1]).toBeCloseTo(0.8)
    const colorCell = s.color[1] ?? 0
    expect(isColorSet(colorCell)).toBe(true)
    expect(unpackRgb(colorCell)).toEqual([0xff, 0xe1, 0x56])
  })

  it("centers text within the surface", () => {
    const s = createSurface(16, 8)

    drawStringCentered(s, "A", 0)

    expect(s.buffer[5]).toBe(0)
    expect(s.buffer[6]).toBe(1)
    expect(s.buffer[7]).toBe(1)
    expect(s.buffer[8]).toBe(1)
    expect(s.buffer[9]).toBe(0)
  })

  it("centers and scales text", () => {
    const s = createSurface(16, 16)

    drawStringScaledCentered(s, "A", 0, 2)

    expect(s.buffer[5]).toBe(1)
    expect(s.buffer[6]).toBe(1)
    expect(s.buffer[16 + 5]).toBe(1)
    expect(s.buffer[16 + 6]).toBe(1)
  })
})
