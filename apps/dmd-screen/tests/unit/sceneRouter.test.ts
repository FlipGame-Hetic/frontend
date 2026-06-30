import { describe, it, expect, vi } from "vitest"
import { ScreenEventRouter } from "@/dmd/sceneRouter"
import type { ScreenEnvelope } from "@frontend/types"

function makeScenes() {
  return {
    playing: { update: vi.fn() },
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
  it("routes phase_change to the score scene and notifies the phase hook", () => {
    const scenes = makeScenes()
    const onPhaseChange = vi.fn()
    const router = new ScreenEventRouter(scenes, { onPhaseChange, onComboFlash: vi.fn() })

    router.handle(env("phase_change", { phase: "playing", player: 2, ball: 3 }))

    expect(scenes.playing.update).toHaveBeenCalledWith({ player: 2, ballNumber: 3 })
    expect(onPhaseChange).toHaveBeenCalledWith("playing")
  })

  it("tracks max lives so the hearts denominator stays stable as balls drain", () => {
    const scenes = makeScenes()
    const router = new ScreenEventRouter(scenes, { onPhaseChange: vi.fn(), onComboFlash: vi.fn() })

    router.handle(env("phase_change", { phase: "playing" }))
    router.handle(env("LifeUpdate", { lives_remaining: 3 }))
    router.handle(env("LifeUpdate", { lives_remaining: 2 }))

    expect(scenes.playing.update).toHaveBeenLastCalledWith({ lives: 2, maxLives: 3 })
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

    router.handle(env("ScoreUpdate", { score: 1234, player: "1", ball: 2, multiplier: 2 }))

    expect(scenes.playing.update).toHaveBeenCalledWith({
      score: 1234,
      player: 1,
      ballNumber: 2,
      multiplier: 2,
    })
    expect(scenes.game_over.update).toHaveBeenCalledWith(1234)
  })
})
