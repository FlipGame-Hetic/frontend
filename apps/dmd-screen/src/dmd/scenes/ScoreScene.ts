import type { RenderContext, Scene } from "../types"
import { setPixel } from "../buffer"
import { drawString, drawStringCentered, measureString, drawStringScaledCentered } from "../font"
import { drawHearts } from "../icons"
import { drawCorners } from "../frame"
import { drawScore, fitScore, measureScore, SCORE_GLYPH_HEIGHT } from "../scoreFont"
import { AnimatedNumber } from "../animatedNumber"
import { Pulse } from "../pulse"
import { PopupStack } from "../popupStack"
import { SceneTransition } from "../sceneTransition"
import { MAX_BALLS } from "../constants"
import { formatScore } from "@frontend/utils"
import {
  HEARTS_X,
  HEARTS_Y,
  HEARTS_INTRO_RISE,
  HEART_SCALE,
  SCORE_MAX_WIDTH,
  SCORE_INTRO_RISE,
  SCORE_SHIMMER_MS,
  SCORE_ROLL_MS,
  MULT_MARGIN,
  MULT_Y_FROM_BOTTOM,
  MULT_PULSE_MS,
  MULT_DRAIN_MAX,
  DELTA_LIFETIME_MS,
  DELTA_MAX,
  DELTA_RISE,
  DELTA_Y,
  BRACKET_BASE,
  BRACKET_SWING,
  BRACKET_GLOW_MS,
  INTRO_MS,
} from "./scoreSceneConfig"

const SCORE_COLOR = "cyan"
const GHOST_PINK = "pink"
const GHOST_CYAN = "cyan"
const HEART_COLOR = "red"
const MULT_COLOR = "yellow"
const DELTA_COLOR = "green"
const BRACKET_COLOR = "cyan"

function formatMultiplier(m: number): string {
  return Number.isInteger(m) ? String(m) : m.toFixed(1)
}

/**
 * The in-game "Hero Score" scene: a large cyan score with chromatic aberration,
 * red hearts for lives, a transient yellow multiplier badge, green floating score
 * deltas, and ambient corner-bracket glow. All motion runs on the shared
 * delta-time primitives; the router feeds it via the setter methods below.
 */
export class ScoreScene implements Scene {
  private readonly scoreNum = new AnimatedNumber(0, SCORE_ROLL_MS)
  private readonly multPulse = new Pulse(MULT_PULSE_MS)
  private readonly deltas = new PopupStack({ lifetimeMs: DELTA_LIFETIME_MS, max: DELTA_MAX })
  private readonly intro = new SceneTransition(INTRO_MS)

  private multiplier = 1
  private multRemainingMs = 0
  private multWindowMs = 0
  private lives = MAX_BALLS
  private maxLives = MAX_BALLS

  setScore(score: number): void {
    this.scoreNum.setTarget(score)
  }

  setMultiplier(multiplier: number, durationMs?: number): void {
    const changed = multiplier !== this.multiplier
    this.multiplier = multiplier
    if (durationMs !== undefined && durationMs > 0) {
      this.multWindowMs = durationMs
      this.multRemainingMs = durationMs
      this.multPulse.trigger()
    } else if (changed && this.multRemainingMs > 0) {
      this.multPulse.trigger()
    }
  }

  setLives(lives: number, maxLives: number): void {
    this.lives = lives
    this.maxLives = maxLives
  }

  pushDelta(delta: number): void {
    if (delta <= 0) return
    this.deltas.push("+" + String(delta))
  }

  enter(): void {
    this.intro.enter()
  }

  render(ctx: RenderContext): void {
    const { cols, rows, deltaMs, elapsedMs } = ctx

    this.scoreNum.advance(deltaMs)
    this.multPulse.advance(deltaMs)
    this.deltas.advance(deltaMs)
    this.intro.advance(deltaMs)
    if (this.multRemainingMs > 0) {
      this.multRemainingMs = Math.max(0, this.multRemainingMs - deltaMs)
    }

    const p = this.intro.progress

    this.renderScore(ctx, cols, rows, elapsedMs, p)
    this.renderHearts(ctx, p)
    this.renderMultiplier(ctx, cols, rows)
    this.renderDeltas(ctx)
    this.renderCorners(ctx, elapsedMs, p)
  }

  private renderScore(
    ctx: RenderContext,
    cols: number,
    rows: number,
    elapsedMs: number,
    p: number,
  ): void {
    const text = formatScore(Math.round(this.scoreNum.value))
    const fit = fitScore(text, SCORE_MAX_WIDTH)
    const shimmer = 0.85 + 0.15 * (0.5 + 0.5 * Math.sin(elapsedMs / SCORE_SHIMMER_MS))
    const bodyBright = shimmer * (0.3 + 0.7 * p)
    const ghostBright = bodyBright * 0.4
    const yRise = Math.round((1 - p) * SCORE_INTRO_RISE)

    if (fit.fits) {
      const width = measureScore(text, fit.scale, fit.spacing)
      const x = Math.floor((cols - width) / 2)
      const y = Math.floor((rows - SCORE_GLYPH_HEIGHT * fit.scale) / 2) + yRise
      // Chromatic aberration: dim pink ghost left, dim cyan ghost right, bright body on top.
      drawScore(ctx, text, x - 1, y, fit.scale, ghostBright, fit.spacing, GHOST_PINK)
      drawScore(ctx, text, x + 1, y, fit.scale, ghostBright * 0.8, fit.spacing, GHOST_CYAN)
      drawScore(ctx, text, x, y, fit.scale, bodyBright, fit.spacing, SCORE_COLOR)
    } else {
      // Extreme width — fall back to the thin scaled font so it never overflows.
      const scale = 2
      const y = Math.floor((rows - 7 * scale) / 2) + yRise
      drawStringScaledCentered(ctx, text, y, scale, 1, bodyBright, SCORE_COLOR)
    }
  }

  private renderHearts(ctx: RenderContext, p: number): void {
    const heartY = HEARTS_Y - Math.round((1 - p) * HEARTS_INTRO_RISE)
    drawHearts(
      ctx,
      HEARTS_X,
      heartY,
      this.lives,
      this.maxLives,
      p,
      0.15 * p,
      HEART_COLOR,
      HEART_SCALE,
    )
  }

  private renderMultiplier(ctx: RenderContext, cols: number, rows: number): void {
    if (this.multiplier <= 1 || this.multRemainingMs <= 0) return

    const text = "X" + formatMultiplier(this.multiplier)
    const width = measureString(text, 1)
    const x = cols - MULT_MARGIN - width
    const y = rows - MULT_Y_FROM_BOTTOM
    const boost = this.multPulse.value
    const brightness = Math.min(1, 0.7 + 0.5 * boost)
    drawString(ctx, text, x, y, 1, brightness, MULT_COLOR)

    // Drain bar under the badge shrinks with the remaining buff duration.
    const frac = this.multWindowMs > 0 ? this.multRemainingMs / this.multWindowMs : 0
    const drainW = Math.round(frac * MULT_DRAIN_MAX)
    for (let i = 0; i < drainW; i++) {
      setPixel(ctx, x + i, y + 8, 0.6, MULT_COLOR)
    }
  }

  private renderDeltas(ctx: RenderContext): void {
    for (const item of this.deltas.items) {
      const rise = Math.round(item.progress * DELTA_RISE)
      const brightness = Math.max(0, 1 - item.progress)
      drawStringCentered(ctx, item.text, DELTA_Y - rise, 1, brightness, DELTA_COLOR)
    }
  }

  private renderCorners(ctx: RenderContext, elapsedMs: number, p: number): void {
    const swing = 0.5 + 0.5 * Math.sin(elapsedMs / BRACKET_GLOW_MS)
    const glow = (BRACKET_BASE + BRACKET_SWING * swing) * (0.3 + 0.7 * p)
    drawCorners(ctx, glow, BRACKET_COLOR)
  }
}
