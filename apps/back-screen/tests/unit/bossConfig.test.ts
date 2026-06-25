import { describe, it, expect } from "vitest"
import { BOSS_REGISTRY, resolveBoss } from "@/boss/bossConfig"

describe("resolveBoss", () => {
  it("returns the matching boss definition for a known id", () => {
    expect(resolveBoss(0)).toBe(BOSS_REGISTRY[0])
  })

  it("falls back to the first boss for an unknown id", () => {
    expect(resolveBoss(99)).toBe(BOSS_REGISTRY[0])
  })

  it("falls back to the first boss when id is null", () => {
    expect(resolveBoss(null)).toBe(BOSS_REGISTRY[0])
  })
})
