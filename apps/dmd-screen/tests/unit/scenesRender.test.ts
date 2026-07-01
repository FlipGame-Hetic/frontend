import { afterEach, describe, expect, it, vi } from "vitest"
import type { RenderContext } from "@/dmd/types"
import { createSurface } from "@/dmd/buffer"
import { HEARTS_X, HEARTS_Y } from "@/dmd/scenes/scoreSceneConfig"
import { ARROW_GAP, ARROW_W, COMBO_SCALE } from "@/dmd/scenes/comboSceneConfig"
import { IdleScene } from "@/dmd/scenes/IdleScene"
import { PausedScene } from "@/dmd/scenes/PausedScene"
import { GameOverScene } from "@/dmd/scenes/GameOverScene"
import { ScoreScene } from "@/dmd/scenes/ScoreScene"
import { PreGameScene } from "@/dmd/scenes/PreGameScene"
import { ComboScene } from "@/dmd/scenes/ComboScene"

const COLS = 128
const ROWS = 72

function makeCtx(elapsedMs = 0, deltaMs = 16): RenderContext {
  return {
    ...createSurface(COLS, ROWS),
    deltaMs,
    elapsedMs,
  }
}

function litCount(ctx: RenderContext): number {
  return Array.from(ctx.buffer).filter((value) => value > 0).length
}

function litInRect(ctx: RenderContext, x0: number, y0: number, x1: number, y1: number): number {
  let n = 0
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if ((ctx.buffer[y * ctx.cols + x] ?? 0) > 0) n++
    }
  }
  return n
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("DMD scenes", () => {
  it("IdleScene renders the attract title and glowing corners", () => {
    const ctx = makeCtx(0)

    new IdleScene().render(ctx)

    expect(litCount(ctx)).toBeGreaterThan(100)
    // Top-left corner bracket is lit with the ambient glow (variable, not a fixed 0.3).
    expect(ctx.buffer[0]).toBeGreaterThan(0)
  })

  it("PausedScene renders centered pause text", () => {
    const ctx = makeCtx()

    new PausedScene().render(ctx)

    expect(litCount(ctx)).toBeGreaterThan(20)
  })

  it("GameOverScene renders the final score and shared corners", () => {
    const scene = new GameOverScene()
    scene.update(9876)
    const ctx = makeCtx(0)

    scene.render(ctx)

    expect(litCount(ctx)).toBeGreaterThan(100)
    expect(ctx.buffer[0]).toBeCloseTo(0.3)
  })

  it("ScoreScene renders a hero score and hearts once the intro completes", () => {
    const scene = new ScoreScene()
    scene.enter()
    scene.setScore(1234)
    scene.setLives(2, 3)
    // Advance internal timers (roll-up + intro) on throwaway surfaces.
    for (let i = 0; i < 50; i++) scene.render(makeCtx(i * 16))

    const ctx = makeCtx(800)
    scene.render(ctx)

    expect(litCount(ctx)).toBeGreaterThan(40)
    // A filled heart is bright at the top-left once the intro has finished.
    // (Heart top row is 0b01010; at 2x scale the first lit column lands at x+2.)
    expect(ctx.buffer[HEARTS_Y * COLS + HEARTS_X + 2]).toBeGreaterThan(0.4)
  })

  it("ScoreScene shows a multiplier badge only while a buff is active", () => {
    const active = new ScoreScene()
    active.setMultiplier(2, 4000)
    const onCtx = makeCtx(0)
    active.render(onCtx)
    expect(litInRect(onCtx, COLS - 30, ROWS - 14, COLS - 4, ROWS - 4)).toBeGreaterThan(0)

    const idle = new ScoreScene()
    const offCtx = makeCtx(0)
    idle.render(offCtx)
    expect(litInRect(offCtx, COLS - 30, ROWS - 14, COLS - 4, ROWS - 4)).toBe(0)
  })

  it("PreGameScene renders the synthwave road, sun, and skyline", () => {
    const scene = new PreGameScene()
    const ctx = makeCtx(0)

    scene.render(ctx)

    // Horizon line spans the full width, plus sun / road / buildings on top.
    expect(litCount(ctx)).toBeGreaterThan(150)
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
