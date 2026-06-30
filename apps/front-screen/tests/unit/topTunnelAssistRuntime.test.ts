import { describe, it, expect } from "vitest"
import { Vector3 } from "three"
import {
  clamp01,
  smoothstep,
  createRuntimeSegment,
  createRuntimeCornerBlend,
  distanceAlongSegment,
  closestPointOnSegment,
  getCornerBlendWeight,
} from "@/components/topTunnelAssist/topTunnelAssistRuntime"
import type { TopTunnelAssistSegmentConfig } from "@/components/topTunnelAssist/topTunnelAssistConfig"

function makeSegmentConfig(
  id: string,
  start: [number, number, number],
  end: [number, number, number],
): TopTunnelAssistSegmentConfig {
  return {
    id: id as TopTunnelAssistSegmentConfig["id"],
    start,
    end,
    sensorHalfExtents: [1, 1, 1],
    sensorPosition: [0, 0, 0],
    centerPullAccel: 0,
    forwardAccel: 0,
  }
}

describe("clamp01", () => {
  it("clamps values below 0 to 0", () => {
    expect(clamp01(-5)).toBe(0)
  })
  it("clamps values above 1 to 1", () => {
    expect(clamp01(2)).toBe(1)
  })
  it("passes through values in range", () => {
    expect(clamp01(0.5)).toBe(0.5)
  })
  it("passes 0 and 1 unchanged", () => {
    expect(clamp01(0)).toBe(0)
    expect(clamp01(1)).toBe(1)
  })
})

describe("smoothstep", () => {
  it("returns 0 at input 0", () => {
    expect(smoothstep(0)).toBe(0)
  })
  it("returns 1 at input 1", () => {
    expect(smoothstep(1)).toBe(1)
  })
  it("returns 0.5 at input 0.5", () => {
    expect(smoothstep(0.5)).toBeCloseTo(0.5)
  })
  it("clamps input below 0", () => {
    expect(smoothstep(-1)).toBe(0)
  })
  it("clamps input above 1", () => {
    expect(smoothstep(2)).toBe(1)
  })
  it("has a smooth curve (mid > linear)", () => {
    expect(smoothstep(0.25)).toBeLessThan(0.5)
    expect(smoothstep(0.75)).toBeGreaterThan(0.5)
  })
})

describe("createRuntimeSegment", () => {
  it("computes a normalized direction", () => {
    const config = makeSegmentConfig("entry-drop", [0, 0, 0], [3, 0, 4])
    const seg = createRuntimeSegment(config, 0)
    const len = seg.direction.length()
    expect(len).toBeCloseTo(1, 5)
  })

  it("computes the correct length", () => {
    const config = makeSegmentConfig("entry-drop", [0, 0, 0], [3, 0, 4])
    const seg = createRuntimeSegment(config, 0)
    expect(seg.length).toBeCloseTo(5)
  })

  it("preserves start and end as Vector3", () => {
    const config = makeSegmentConfig("top-cross", [1, 2, 3], [4, 5, 6])
    const seg = createRuntimeSegment(config, 1)
    expect(seg.start).toBeInstanceOf(Vector3)
    expect(seg.end).toBeInstanceOf(Vector3)
    expect(seg.start.x).toBe(1)
    expect(seg.end.z).toBe(6)
  })

  it("handles zero-length segments without crashing", () => {
    const config = makeSegmentConfig("left-return", [1, 0, 0], [1, 0, 0])
    const seg = createRuntimeSegment(config, 2)
    expect(seg.length).toBe(0)
    expect(seg.direction.length()).toBe(0)
  })
})

describe("distanceAlongSegment", () => {
  it("returns 0 at the start point", () => {
    const config = makeSegmentConfig("entry-drop", [0, 0, 0], [10, 0, 0])
    const seg = createRuntimeSegment(config, 0)
    expect(distanceAlongSegment(new Vector3(0, 0, 0), seg)).toBeCloseTo(0)
  })

  it("returns the segment length at the end point", () => {
    const config = makeSegmentConfig("entry-drop", [0, 0, 0], [10, 0, 0])
    const seg = createRuntimeSegment(config, 0)
    expect(distanceAlongSegment(new Vector3(10, 0, 0), seg)).toBeCloseTo(10)
  })

  it("returns a partial distance at a midpoint", () => {
    const config = makeSegmentConfig("top-cross", [0, 0, 0], [10, 0, 0])
    const seg = createRuntimeSegment(config, 0)
    expect(distanceAlongSegment(new Vector3(4, 0, 0), seg)).toBeCloseTo(4)
  })
})

describe("closestPointOnSegment", () => {
  it("returns the projection of a point onto the segment", () => {
    const config = makeSegmentConfig("entry-drop", [0, 0, 0], [10, 0, 0])
    const seg = createRuntimeSegment(config, 0)
    const closest = closestPointOnSegment(new Vector3(5, 3, 0), seg)
    expect(closest.x).toBeCloseTo(5)
    expect(closest.y).toBeCloseTo(0)
  })

  it("clamps before the start point", () => {
    const config = makeSegmentConfig("entry-drop", [0, 0, 0], [10, 0, 0])
    const seg = createRuntimeSegment(config, 0)
    const closest = closestPointOnSegment(new Vector3(-5, 0, 0), seg)
    expect(closest.x).toBeCloseTo(0)
  })

  it("clamps past the end point", () => {
    const config = makeSegmentConfig("entry-drop", [0, 0, 0], [10, 0, 0])
    const seg = createRuntimeSegment(config, 0)
    const closest = closestPointOnSegment(new Vector3(15, 0, 0), seg)
    expect(closest.x).toBeCloseTo(10)
  })
})

describe("createRuntimeCornerBlend", () => {
  it("returns null when fromSegmentId is not found", () => {
    const to = createRuntimeSegment(makeSegmentConfig("top-cross", [0, 0, 0], [1, 0, 0]), 0)
    const result = createRuntimeCornerBlend(
      {
        fromSegmentId: "entry-drop",
        toSegmentId: "top-cross",
        beforeDistance: 1,
        afterDistance: 1,
      },
      [to],
    )
    expect(result).toBeNull()
  })

  it("returns a blend when both segments are found", () => {
    const from = createRuntimeSegment(makeSegmentConfig("entry-drop", [0, 0, 0], [5, 0, 0]), 0)
    const to = createRuntimeSegment(makeSegmentConfig("top-cross", [5, 0, 0], [10, 0, 0]), 1)
    const result = createRuntimeCornerBlend(
      {
        fromSegmentId: "entry-drop",
        toSegmentId: "top-cross",
        beforeDistance: 1,
        afterDistance: 1,
      },
      [from, to],
    )
    expect(result).not.toBeNull()
    expect(result?.from.config.id).toBe("entry-drop")
    expect(result?.to.config.id).toBe("top-cross")
  })
})

describe("getCornerBlendWeight", () => {
  it("returns null when point is far from any corner", () => {
    const from = createRuntimeSegment(makeSegmentConfig("entry-drop", [0, 0, 0], [10, 0, 0]), 0)
    const to = createRuntimeSegment(makeSegmentConfig("top-cross", [10, 0, 0], [20, 0, 0]), 1)
    const blend = createRuntimeCornerBlend(
      {
        fromSegmentId: "entry-drop",
        toSegmentId: "top-cross",
        beforeDistance: 1,
        afterDistance: 1,
      },
      [from, to],
    )
    if (!blend) throw new Error("Expected non-null blend")
    const result = getCornerBlendWeight(new Vector3(5, 0, 0), from, [blend])
    expect(result).toBeNull()
  })

  it("returns a blend weight near the corner", () => {
    const from = createRuntimeSegment(makeSegmentConfig("entry-drop", [0, 0, 0], [10, 0, 0]), 0)
    const to = createRuntimeSegment(makeSegmentConfig("top-cross", [10, 0, 0], [20, 0, 0]), 1)
    const blend = createRuntimeCornerBlend(
      {
        fromSegmentId: "entry-drop",
        toSegmentId: "top-cross",
        beforeDistance: 2,
        afterDistance: 2,
      },
      [from, to],
    )
    if (!blend) throw new Error("Expected non-null blend")
    const result = getCornerBlendWeight(new Vector3(9, 0, 0), from, [blend])
    expect(result).not.toBeNull()
    expect(result?.toWeight).toBeGreaterThanOrEqual(0)
    expect(result?.toWeight).toBeLessThanOrEqual(1)
  })
})
