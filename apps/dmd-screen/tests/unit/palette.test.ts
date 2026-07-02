import { describe, it, expect, vi } from "vitest"
import { resolveColor, isColorSet, unpackRgb, hexToRgb, PALETTE } from "@/dmd/palette"

describe("hexToRgb", () => {
  it("splits a #rrggbb string into [r, g, b] components", () => {
    expect(hexToRgb("#123456")).toEqual([0x12, 0x34, 0x56])
  })

  it("tolerates a bare hex string without the leading #", () => {
    expect(hexToRgb("00f0ff")).toEqual([0x00, 0xf0, 0xff])
  })
})

describe("resolveColor", () => {
  it("resolves a palette name to packed rgb with the set flag", () => {
    const cell = resolveColor("cyan")
    expect(isColorSet(cell)).toBe(true)
    expect(cell & 0xffffff).toBe(PALETTE.cyan)
    expect(unpackRgb(cell)).toEqual([0x00, 0xf0, 0xff])
  })

  it("resolves a #hex string", () => {
    expect(unpackRgb(resolveColor("#22d3ee"))).toEqual([0x22, 0xd3, 0xee])
  })

  it("resolves an [r,g,b] tuple", () => {
    expect(unpackRgb(resolveColor([255, 128, 0]))).toEqual([255, 128, 0])
  })

  it("resolves a packed number", () => {
    expect(unpackRgb(resolveColor(0x123456))).toEqual([0x12, 0x34, 0x56])
  })

  it("keeps the set flag for pure black so it differs from unset", () => {
    const cell = resolveColor([0, 0, 0])
    expect(cell).not.toBe(0)
    expect(isColorSet(cell)).toBe(true)
    expect(unpackRgb(cell)).toEqual([0, 0, 0])
  })

  it("returns 0 and warns on an unknown palette name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    expect(resolveColor("chartreuse")).toBe(0)
    expect(isColorSet(0)).toBe(false)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it("returns 0 and warns on an invalid hex string", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    expect(resolveColor("#xyz")).toBe(0)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
