import { describe, it, expect } from "vitest"
import { hasBallId, getBallId } from "@/components/balls/runtime/ballUserData"

describe("hasBallId", () => {
  it("returns true for an object with a string ballId", () => {
    expect(hasBallId({ ballId: "abc-123" })).toBe(true)
  })

  it("returns false for null", () => {
    expect(hasBallId(null)).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(hasBallId(undefined)).toBe(false)
  })

  it("returns false for a plain string", () => {
    expect(hasBallId("abc")).toBe(false)
  })

  it("returns false when ballId is a number", () => {
    expect(hasBallId({ ballId: 42 })).toBe(false)
  })

  it("returns false when ballId key is absent", () => {
    expect(hasBallId({ otherId: "abc" })).toBe(false)
  })
})

describe("getBallId", () => {
  it("returns the ballId string when present", () => {
    expect(getBallId({ ballId: "ball-007" })).toBe("ball-007")
  })

  it("returns undefined for null", () => {
    expect(getBallId(null)).toBeUndefined()
  })

  it("returns undefined for a number ballId", () => {
    expect(getBallId({ ballId: 99 })).toBeUndefined()
  })

  it("returns undefined for an empty object", () => {
    expect(getBallId({})).toBeUndefined()
  })
})
