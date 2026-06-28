import { describe, expect, it } from "vitest"
import {
  AMBIENT_EVENT_BASE_DELAY_MS,
  AMBIENT_EVENT_DELAY_JITTER_MS,
  AMBIENT_EVENT_IDS,
  AMBIENT_EVENTS,
  type Waypoint,
} from "@/components/ambientEvents/ambientEventsConfig"
import {
  applyZJitter,
  buildEventInstance,
  computeNextDelayMs,
  pickNextEventId,
  pickRoute,
} from "@/components/ambientEvents/ambientEventScheduler"

// Deterministic rng that cycles through fixed values
const seq = (values: number[]): (() => number) => {
  let i = 0
  return () => {
    const value = values[i % values.length] ?? 0
    i += 1
    return value
  }
}

describe("computeNextDelayMs", () => {
  it("returns the base delay when rng is 0", () => {
    expect(computeNextDelayMs(() => 0)).toBe(AMBIENT_EVENT_BASE_DELAY_MS)
  })

  it("stays within [base, base + jitter]", () => {
    const value = computeNextDelayMs(() => 0.999)
    expect(value).toBeGreaterThanOrEqual(AMBIENT_EVENT_BASE_DELAY_MS)
    expect(value).toBeLessThanOrEqual(AMBIENT_EVENT_BASE_DELAY_MS + AMBIENT_EVENT_DELAY_JITTER_MS)
  })
})

describe("pickNextEventId", () => {
  it("never replays the previous id", () => {
    for (const previous of AMBIENT_EVENT_IDS) {
      for (let r = 0; r < 1; r += 0.1) {
        expect(pickNextEventId(previous, () => r)).not.toBe(previous)
      }
    }
  })

  it("can pick any id when there is no previous", () => {
    const picked = new Set(
      AMBIENT_EVENT_IDS.map((_, i) => pickNextEventId(null, () => i / AMBIENT_EVENT_IDS.length)),
    )
    expect(picked.size).toBe(AMBIENT_EVENT_IDS.length)
  })
})

describe("applyZJitter", () => {
  it("only shifts z and keeps the same offset across waypoints", () => {
    const waypoints: Waypoint[] = [
      [-9, 7, -2],
      [9, 7, -2],
    ]
    const jittered = applyZJitter(waypoints, () => 1) // dz = +AMBIENT_EVENT_Z_JITTER
    expect(jittered).toHaveLength(waypoints.length)

    const deltas = jittered.map((point, index) => {
      const source = waypoints[index]
      if (!source) throw new Error("missing source waypoint")
      expect(point[0]).toBe(source[0])
      expect(point[1]).toBe(source[1])
      expect(point[2]).not.toBe(source[2])
      return point[2] - source[2]
    })
    expect(new Set(deltas).size).toBe(1)
  })
})

describe("pickRoute", () => {
  it("returns a fresh array, not the source route", () => {
    const routes = AMBIENT_EVENTS.flyingCube.routes
    const route = pickRoute(routes, () => 0)
    expect(Object.values(routes)).not.toContain(route)
  })
})

describe("buildEventInstance", () => {
  it("builds a non-repeating instance matching its def", () => {
    const instance = buildEventInstance("flyingCube", seq([0, 0, 0]))
    expect(instance.id).not.toBe("flyingCube")
    expect(instance.def).toBe(AMBIENT_EVENTS[instance.id])
    expect(instance.waypoints.length).toBeGreaterThan(1)
  })
})
