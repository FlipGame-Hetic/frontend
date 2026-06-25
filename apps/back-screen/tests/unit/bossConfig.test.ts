import { describe, it, expect } from "vitest"
import { BOSS_REGISTRY, resolveBoss } from "@/boss/bossConfig"

describe("resolveBoss", () => {
  it("returns the matching boss definition for a known id", () => {
    expect(resolveBoss(0)).toBe(BOSS_REGISTRY[0])
  })

  it("exposes one label for each story boss id", () => {
    expect(resolveBoss(0).name).toBe("SEPHI v0.1.0")
    expect(resolveBoss(1).name).toBe("SEPHI v0.2.0")
    expect(resolveBoss(2).name).toBe("SEPHI v0.3.0")
  })

  it("falls back to the first boss for an unknown id", () => {
    expect(resolveBoss(99)).toBe(BOSS_REGISTRY[0])
  })

  it("falls back to the first boss when id is null", () => {
    expect(resolveBoss(null)).toBe(BOSS_REGISTRY[0])
  })
})
