import { describe, it, expect, vi } from "vitest"
import { ScreenEventRouter } from "@/dmd/sceneRouter"
import type { ScreenEnvelope } from "@frontend/types"

function makeScenes() {
  return {
    playing: {
      setScore: vi.fn(),
      setMultiplier: vi.fn(),
      setLives: vi.fn(),
      pushDelta: vi.fn(),
      enter: vi.fn(),
    },
    game_over: { update: vi.fn() },
    combo: { update: vi.fn() },
    mode_select: { update: vi.fn() },
    character_select: { update: vi.fn() },
  }
}

function env(eventType: string, payload: unknown): ScreenEnvelope {
  return { from: "backend", to: { kind: "broadcast" }, event_type: eventType, payload }
}

describe("ScreenEventRouter", () => {
  it("triggers the score scene intro and notifies the hook on entering playing", () => {
    const scenes = makeScenes()
    const onPhaseChange = vi.fn()
    const router = new ScreenEventRouter(scenes, { onPhaseChange, onComboFlash: vi.fn() })

    router.handle(env("phase_change", { phase: "playing" }))

    expect(scenes.playing.enter).toHaveBeenCalled()
    expect(onPhaseChange).toHaveBeenCalledWith("playing")
  })

  it("tracks max lives so the hearts denominator stays stable as balls drain", () => {
    const scenes = makeScenes()
    const router = new ScreenEventRouter(scenes, { onPhaseChange: vi.fn(), onComboFlash: vi.fn() })

    router.handle(env("phase_change", { phase: "playing" }))
    router.handle(env("LifeUpdate", { lives_remaining: 3 }))
    router.handle(env("LifeUpdate", { lives_remaining: 2 }))

    expect(scenes.playing.setLives).toHaveBeenLastCalledWith(2, 3)
  })

  it("fires the combo flash hook and forwards a parsed sequence", () => {
    const scenes = makeScenes()
    const onComboFlash = vi.fn()
    const router = new ScreenEventRouter(scenes, { onPhaseChange: vi.fn(), onComboFlash })

    router.handle(env("ComboActivated", { sequence: ["L", "R"], bonus_pts: 0 }))

    expect(scenes.combo.update).toHaveBeenCalledWith({ sequence: ["L", "R"] })
    expect(onComboFlash).toHaveBeenCalled()
  })

  it("updates both the live score and the game-over score on ScoreUpdate", () => {
    const scenes = makeScenes()
    const router = new ScreenEventRouter(scenes, { onPhaseChange: vi.fn(), onComboFlash: vi.fn() })

    router.handle(env("ScoreUpdate", { score: 1234, multiplier: 2 }))

    expect(scenes.playing.setScore).toHaveBeenCalledWith(1234)
    expect(scenes.playing.setMultiplier).toHaveBeenCalledWith(2)
    expect(scenes.game_over.update).toHaveBeenCalledWith(1234)
  })

  it("routes a ScoreDelta to a floating score pop", () => {
    const scenes = makeScenes()
    const router = new ScreenEventRouter(scenes, { onPhaseChange: vi.fn(), onComboFlash: vi.fn() })

    router.handle(env("ScoreDelta", { delta: 500, reason: "bumper", total: 5000 }))

    expect(scenes.playing.pushDelta).toHaveBeenCalledWith(500)
  })

  it("passes the multiplier and its duration on MultiplierUpdate", () => {
    const scenes = makeScenes()
    const router = new ScreenEventRouter(scenes, { onPhaseChange: vi.fn(), onComboFlash: vi.fn() })

    router.handle(env("MultiplierUpdate", { multiplier: 3, duration_ms: 4000 }))

    expect(scenes.playing.setMultiplier).toHaveBeenCalledWith(3, 4000)
  })
})
