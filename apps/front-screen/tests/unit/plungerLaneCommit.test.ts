import { describe, expect, it } from "vitest"
import {
  clampPlungerPosition,
  getPlungerImpulse,
  isPastPlungerLaneGate,
  isPointInPlungerLaneSensor,
  PLUNGER_LANE_GATE_HALF_EXTENTS,
  PLUNGER_LANE_GATE_NORMAL,
  PLUNGER_LANE_GATE_POSITION,
  PLUNGER_LANE_SENSOR_POSITION,
  PLUNGER_MAX_IMPULSE,
  PLUNGER_MIN_IMPULSE,
} from "@/components/plunger/plungerConfig"

describe("isPastPlungerLaneGate", () => {
  it("returns true when the point is on the playfield side of the gate", () => {
    expect(
      isPastPlungerLaneGate(
        { x: 3.85, y: 1, z: -2.1 },
        PLUNGER_LANE_GATE_POSITION,
        PLUNGER_LANE_GATE_NORMAL,
      ),
    ).toBe(true)
  })

  it("returns false when the point is still on the plunger lane side", () => {
    expect(
      isPastPlungerLaneGate(
        { x: 3.85, y: 1, z: -1.5 },
        PLUNGER_LANE_GATE_POSITION,
        PLUNGER_LANE_GATE_NORMAL,
      ),
    ).toBe(false)
  })

  it("returns false on the gate plane", () => {
    expect(
      isPastPlungerLaneGate(
        { x: 3.85, y: 1, z: PLUNGER_LANE_GATE_POSITION[2] },
        PLUNGER_LANE_GATE_POSITION,
        PLUNGER_LANE_GATE_NORMAL,
      ),
    ).toBe(false)
  })
})

describe("isPointInPlungerLaneSensor", () => {
  it("returns true for the sensor center", () => {
    const [x, y, z] = PLUNGER_LANE_SENSOR_POSITION

    expect(isPointInPlungerLaneSensor({ x, y, z })).toBe(true)
  })

  it("returns false for a central playfield point outside the lane sensor", () => {
    expect(isPointInPlungerLaneSensor({ x: 0, y: 1, z: 0 })).toBe(false)
  })
})

describe("clampPlungerPosition", () => {
  it("clamps negative positions to rest", () => {
    expect(clampPlungerPosition(-0.25)).toBe(0)
  })

  it("clamps positions above max to fully pulled", () => {
    expect(clampPlungerPosition(1.25)).toBe(1)
  })
})

describe("getPlungerImpulse", () => {
  it("returns less than max impulse for a partial release", () => {
    expect(getPlungerImpulse(0.5)).toBeLessThan(PLUNGER_MAX_IMPULSE)
  })

  it("returns min and max impulse at the bounds", () => {
    expect(getPlungerImpulse(0)).toBe(PLUNGER_MIN_IMPULSE)
    expect(getPlungerImpulse(1)).toBe(PLUNGER_MAX_IMPULSE)
  })
})

describe("PLUNGER_LANE_GATE_HALF_EXTENTS", () => {
  it("has positive values for all axes", () => {
    const [hx, hy, hz] = PLUNGER_LANE_GATE_HALF_EXTENTS
    expect(hx).toBeGreaterThan(0)
    expect(hy).toBeGreaterThan(0)
    expect(hz).toBeGreaterThan(0)
  })
})
