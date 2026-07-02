import { beforeEach, describe, expect, it } from "vitest"
import {
  getAnyBallPosition,
  getBallPosition,
  getBallPositionEntries,
  removeBallPosition,
  setBallPosition,
} from "@/components/balls/runtime/ballPositionRegistry"

describe("ballPositionRegistry", () => {
  beforeEach(() => {
    // Positions are module state : wipe any leaked between tests
    for (const { id } of getBallPositionEntries()) removeBallPosition(id)
  })

  it("returns undefined for an unknown ball", () => {
    expect(getBallPosition("nope")).toBeUndefined()
  })

  it("stores and reads back a position", () => {
    setBallPosition("a", 1, 2, 3)
    expect(getBallPosition("a")).toEqual({ x: 1, y: 2, z: 3 })
  })

  it("updates a position in place across sets", () => {
    setBallPosition("a", 1, 2, 3)
    setBallPosition("a", 4, 5, 6)
    expect(getBallPosition("a")).toEqual({ x: 4, y: 5, z: 6 })
  })

  it("mutating a returned copy does not affect the stored value", () => {
    setBallPosition("a", 1, 2, 3)
    const read = getBallPosition("a")
    if (!read) throw new Error("Expected a stored position")
    read.x = 999
    expect(getBallPosition("a")).toEqual({ x: 1, y: 2, z: 3 })
  })

  it("updating the store does not mutate a previously returned copy", () => {
    setBallPosition("a", 1, 2, 3)
    const read = getBallPosition("a")
    setBallPosition("a", 4, 5, 6)
    expect(read).toEqual({ x: 1, y: 2, z: 3 })
  })

  it("two successive reads return distinct objects", () => {
    setBallPosition("a", 1, 2, 3)
    expect(getBallPosition("a")).not.toBe(getBallPosition("a"))
  })

  it("removes a position", () => {
    setBallPosition("a", 1, 2, 3)
    removeBallPosition("a")
    expect(getBallPosition("a")).toBeUndefined()
  })

  it("getAnyBallPosition returns a copy of some stored position", () => {
    setBallPosition("a", 1, 2, 3)
    const any = getAnyBallPosition()
    expect(any).toEqual({ x: 1, y: 2, z: 3 })
    if (!any) throw new Error("Expected a fallback position")
    any.x = 999
    expect(getBallPosition("a")).toEqual({ x: 1, y: 2, z: 3 })
  })

  it("getAnyBallPosition returns undefined when empty", () => {
    expect(getAnyBallPosition()).toBeUndefined()
  })

  it("getBallPositionEntries snapshots and is decoupled from later writes", () => {
    setBallPosition("a", 1, 2, 3)
    setBallPosition("b", 4, 5, 6)
    const entries = getBallPositionEntries()
    setBallPosition("a", 7, 8, 9)
    expect(entries).toEqual([
      { id: "a", x: 1, y: 2, z: 3 },
      { id: "b", x: 4, y: 5, z: 6 },
    ])
  })
})
