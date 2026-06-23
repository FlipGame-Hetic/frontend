import { describe, expect, it } from "vitest"
import { formatScore, padScore } from "../src/score"

describe("padScore", () => {
  it("pads scores to six digits by default", () => {
    expect(padScore(42)).toBe("000042")
  })

  it("accepts a custom minimum digit count", () => {
    expect(padScore(42, 4)).toBe("0042")
  })

  it("does not truncate larger scores", () => {
    expect(padScore(1234567)).toBe("1234567")
  })
})

describe("formatScore", () => {
  it("formats a padded score with a thousands separator", () => {
    expect(formatScore(42)).toBe("000.042")
  })

  it("keeps the final group at three digits for larger scores", () => {
    expect(formatScore(1234567)).toBe("1234.567")
  })
})
