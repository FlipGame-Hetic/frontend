import { describe, it, expect } from "vitest"
import { SceneTransition } from "@/dmd/sceneTransition"
import { linear } from "@/dmd/ease"

describe("SceneTransition", () => {
  it("reports done (progress 1) before enter is called", () => {
    const t = new SceneTransition(100)
    expect(t.done).toBe(true)
    expect(t.progress).toBe(1)
  })

  it("progresses 0 -> 1 after enter, then reports done", () => {
    const t = new SceneTransition(100, linear)
    t.enter()
    expect(t.progress).toBeCloseTo(0)
    t.advance(50)
    expect(t.progress).toBeCloseTo(0.5)
    t.advance(50)
    expect(t.progress).toBe(1)
    expect(t.done).toBe(true)
  })
})
