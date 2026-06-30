import { afterEach, describe, expect, it, vi } from "vitest"
import type { RenderContext } from "@/dmd/types"
import { createSurface } from "@/dmd/buffer"
import { heartsWidth, HEART_SPACING } from "@/dmd/constants"
import { BAR_WIDTH, BAR_Y } from "@/dmd/scenes/scoreSceneConfig"
import { ARROW_GAP, ARROW_W, COMBO_SCALE } from "@/dmd/scenes/comboSceneConfig"
import { IdleScene } from "@/dmd/scenes/IdleScene"
import { PausedScene } from "@/dmd/scenes/PausedScene"
import { SelectScene } from "@/dmd/scenes/SelectScene"
import { GameOverScene } from "@/dmd/scenes/GameOverScene"
import { ScoreScene } from "@/dmd/scenes/ScoreScene"
import { ComboScene } from "@/dmd/scenes/ComboScene"

const COLS = 128
const ROWS = 72

function makeCtx(elapsedMs = 0): RenderContext {
  return {
    ...createSurface(COLS, ROWS),
    deltaMs: 16,
    elapsedMs,
  }
}

function litCount(ctx: RenderContext): number {
  return Array.from(ctx.buffer).filter((value) => value > 0).length
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("DMD scenes", () => {
  it("IdleScene renders the attract text and shared corners", () => {
    const ctx = makeCtx(0)

    new IdleScene().render(ctx)

    expect(litCount(ctx)).toBeGreaterThan(100)
    expect(ctx.buffer[0]).toBeCloseTo(0.3)
  })

  it("PausedScene renders centered pause text", () => {
    const ctx = makeCtx()

    new PausedScene().render(ctx)

    expect(litCount(ctx)).toBeGreaterThan(20)
  })

  it("SelectScene renders title, blinking value, and hint", () => {
    const scene = new SelectScene("SELECT MODE", 600)
    scene.update("classic")
    const ctx = makeCtx(0)

    scene.render(ctx)

    expect(litCount(ctx)).toBeGreaterThan(120)
  })

  it("GameOverScene renders the final score and shared corners", () => {
    const scene = new GameOverScene()
    scene.update(9876)
    const ctx = makeCtx(0)

    scene.render(ctx)

    expect(litCount(ctx)).toBeGreaterThan(100)
    expect(ctx.buffer[0]).toBeCloseTo(0.3)
  })

  it("ScoreScene renders score info, hearts, and a multiplier timer bar", () => {
    vi.spyOn(performance, "now").mockReturnValue(1000)
    const scene = new ScoreScene()
    scene.update({
      score: 1234,
      player: 2,
      lives: 2,
      maxLives: 3,
      multiplier: 2,
      multiplierStartedAt: 500,
      multiplierDurationMs: 1000,
    })
    const ctx = makeCtx(100)

    scene.render(ctx)

    const infoY = ROWS - 9
    const hx = COLS - 2 - heartsWidth(3)
    expect(ctx.buffer[infoY * COLS + hx + 1]).toBeCloseTo(1)
    expect(ctx.buffer[infoY * COLS + hx + HEART_SPACING * 2 + 1]).toBeCloseTo(0.15)
    expect(ctx.buffer[BAR_Y * COLS + Math.floor((COLS - BAR_WIDTH) / 2)]).toBeCloseTo(0.9)
  })

  it("ComboScene renders combo text, arrows, and shared corners", () => {
    const scene = new ComboScene()
    scene.update({ sequence: ["L", "R"] })
    const ctx = makeCtx(0)

    scene.render(ctx)

    const contentH = COMBO_SCALE * 7 + 6 + 5
    const comboY = Math.floor((ROWS - contentH) / 2)
    const totalW = 2 * ARROW_W + ARROW_GAP
    const arrowX = Math.floor((COLS - totalW) / 2)
    const arrowY = comboY + COMBO_SCALE * 7 + 6
    expect(ctx.buffer[arrowY * COLS + arrowX + 2]).toBeCloseTo(1)
    expect(ctx.buffer[0]).toBeCloseTo(0.3)
  })
})
