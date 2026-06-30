import { describe, it, expect, beforeEach } from "vitest"
import {
  forgetBallContagion,
  isRestingByContagion,
  setBallAtRest,
} from "@/components/balls/runtime/ballRestContagion"
import type { BallPositionEntry } from "@/components/balls/runtime/ballPositionRegistry"

const DIST = 1

const at = (id: string, x: number): BallPositionEntry => ({ id, x, y: 0, z: 0 })

describe("ballRestContagion", () => {
  beforeEach(() => {
    // Seeds are module state : wipe any leaked between tests
    for (const id of ["a", "b", "c", "d"]) forgetBallContagion(id)
  })

  it("a free ball that is not a seed is never suppressed", () => {
    expect(isRestingByContagion("a", [at("a", 0)], DIST)).toBe(false)
  })

  it("a seed ball is suppressed even without a known position", () => {
    setBallAtRest("a", true)
    expect(isRestingByContagion("a", [], DIST)).toBe(true)
  })

  it("clearing the seed lifts the suppression", () => {
    setBallAtRest("a", true)
    setBallAtRest("a", false)
    expect(isRestingByContagion("a", [at("a", 0)], DIST)).toBe(false)
  })

  it("links a ball to a seed just under the contact distance", () => {
    setBallAtRest("b", true)
    expect(isRestingByContagion("a", [at("a", 0), at("b", 0.9)], DIST)).toBe(true)
  })

  it("links a ball to a seed exactly at the contact distance", () => {
    setBallAtRest("b", true)
    expect(isRestingByContagion("a", [at("a", 0), at("b", 1)], DIST)).toBe(true)
  })

  it("does not link a ball to a seed just over the contact distance", () => {
    setBallAtRest("b", true)
    expect(isRestingByContagion("a", [at("a", 0), at("b", 1.1)], DIST)).toBe(false)
  })

  it("contagion is transitive across a stack (a-b-c, c is the seed)", () => {
    setBallAtRest("c", true)
    expect(isRestingByContagion("a", [at("a", 0), at("b", 0.9), at("c", 1.8)], DIST)).toBe(true)
  })

  it("a chain with no seed is not suppressed", () => {
    expect(isRestingByContagion("a", [at("a", 0), at("b", 0.9), at("c", 1.8)], DIST)).toBe(false)
  })

  it("forgetting a ball drops its seed", () => {
    setBallAtRest("a", true)
    forgetBallContagion("a")
    expect(isRestingByContagion("a", [at("a", 0)], DIST)).toBe(false)
  })
})
