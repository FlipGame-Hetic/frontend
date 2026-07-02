import { describe, it, expect } from "vitest"
import { PopupStack } from "@/dmd/popupStack"

describe("PopupStack", () => {
  it("adds items and ages their progress 0 -> 1", () => {
    const s = new PopupStack({ lifetimeMs: 100 })
    s.push("+10")
    expect(s.items).toHaveLength(1)
    expect(s.items[0]?.progress).toBe(0)
    s.advance(50)
    expect(s.items[0]?.progress).toBeCloseTo(0.5)
  })

  it("culls items after their lifetime", () => {
    const s = new PopupStack({ lifetimeMs: 100 })
    s.push("+10")
    s.advance(100)
    expect(s.items).toHaveLength(0)
  })

  it("drops the oldest when exceeding max", () => {
    const s = new PopupStack({ lifetimeMs: 1000, max: 2 })
    s.push("a")
    s.push("b")
    s.push("c")
    expect(s.items.map((i) => i.text)).toEqual(["b", "c"])
  })
})
