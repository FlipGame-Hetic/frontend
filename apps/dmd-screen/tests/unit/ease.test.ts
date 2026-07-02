import { describe, it, expect } from "vitest"
import {
  linear,
  easeOutCubic,
  easeInCubic,
  easeOutQuad,
  easeInOutQuad,
  easeOutBack,
} from "@/dmd/ease"

const all = [linear, easeOutCubic, easeInCubic, easeOutQuad, easeInOutQuad, easeOutBack]

describe("ease", () => {
  it("maps endpoints 0->0 and 1->1", () => {
    for (const f of all) {
      expect(f(0)).toBeCloseTo(0)
      expect(f(1)).toBeCloseTo(1)
    }
  })

  it("clamps out-of-range input", () => {
    for (const f of all) {
      expect(f(-1)).toBeCloseTo(0)
      expect(f(2)).toBeCloseTo(1)
    }
  })

  it("easeOutCubic leads linear at the midpoint", () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(linear(0.5))
  })

  it("easeOutBack overshoots past 1 before settling", () => {
    const peak = Math.max(easeOutBack(0.7), easeOutBack(0.8), easeOutBack(0.9))
    expect(peak).toBeGreaterThan(1)
  })
})
