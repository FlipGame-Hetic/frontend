import { describe, expect, it, vi } from "vitest"
import { BOSS_APPEAR_VOLUME, playBossAppearSequence } from "@/audio/menuSound"
import { playSfxSequence } from "@/audio/sfx"

vi.mock("@/audio/sfx", () => ({
  sfxSources: vi.fn((base: string, dir: string, name: string) => [
    `${base}sounds/${dir}/${name}.ogg`,
    `${base}sounds/${dir}/${name}.m4a`,
  ]),
  playSfx: vi.fn(),
  playSfxSequence: vi.fn(() => vi.fn()),
}))

describe("menuSound", () => {
  it("plays the boss warning sequence with cabinet-safe headroom", () => {
    const onComplete = vi.fn()

    playBossAppearSequence(onComplete)

    const call = vi.mocked(playSfxSequence).mock.calls[0]
    if (call === undefined) {
      throw new Error("Expected playSfxSequence to be called")
    }

    const [, options, callback] = call
    expect(options).toEqual({
      times: 2,
      trailingDelayMs: 200,
      volume: BOSS_APPEAR_VOLUME,
    })
    expect(callback).toBe(onComplete)
  })
})
