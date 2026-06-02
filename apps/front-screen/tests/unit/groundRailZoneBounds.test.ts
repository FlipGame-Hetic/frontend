import { describe, expect, it } from "vitest"
import { isPointInGroundRailZone } from "@/components/playfield/groundRailZoneBounds"

describe("isPointInGroundRailZone", () => {
  it("returns true at the zone center", () => {
    expect(isPointInGroundRailZone({ x: 0, y: 0.6, z: 0 })).toBe(true)
  })

  it("returns false outside the zone", () => {
    expect(isPointInGroundRailZone({ x: 10, y: 0.6, z: 0 })).toBe(false)
  })
})
