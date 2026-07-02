import type { RenderContext, Scene } from "../types"
import { setPixel } from "../buffer"
import { drawStringScaled, measureStringScaled } from "../font"
import { drawCorners } from "../frame"
import { drawScore, fitScore, measureScore } from "../scoreFont"
import { SceneTransition } from "../sceneTransition"
import { formatScore } from "@frontend/utils"
import {
  TITLE_SCALE,
  TITLE_SPACING,
  GAME_Y,
  OVER_Y,
  TITLE_SLAM_RISE,
  TITLE_SHAKE,
  TITLE_SHAKE_END,
  TITLE_PULSE_MS,
  GLITCH_PERIOD_MS,
  GLITCH_DURATION_MS,
  GLITCH_OFFSET,
  FLATLINE_Y,
  FLATLINE_MARGIN,
  FLATLINE_BASE,
  FLATLINE_FLICKER_MS,
  BEAT_AMP,
  BEAT_END,
  SCORE_SCALE_MAX,
  SCORE_Y,
  SCORE_MAX_WIDTH,
  INTRO_MS,
  FLASH_FRACTION,
  FLASH_BRIGHT,
} from "./gameOverSceneConfig"

const TITLE_COLOR = "red" // the player is dead — red dominates
const CORNER_COLOR = "red"
const FLASH_COLOR = "red"
const BEAT_COLOR = "red"
const SCORE_BODY = "red" // classic hero font, tinted red for the death screen
const GHOST_DARK = "#7a0000" // deep blood-red aberration ghost (left)
const GHOST_HOT = "#ff5a7a" // hot pink-red aberration ghost (right)

/**
 * The "Slam & Flatline" game-over scene. On `enter()` a red flash bursts, the big
 * two-line GAME / OVER title slams down with an impact shake, a flatline EKG fires
 * one last heartbeat before going flat, and the final score rolls up 0 → final in
 * the red-tinted hero font. Once settled the title breathes with a slow ominous
 * pulse and glitches periodically. Rendered settled (no animation) before the
 * first `enter()`, so the dev preview shows the composed frame.
 */
export class GameOverScene implements Scene {
  private finalScore = 0
  private readonly intro = new SceneTransition(INTRO_MS)

  /** Keeps the final score current (fed continuously by ScoreUpdate during play). */
  update(score: number): void {
    this.finalScore = score
  }

  /** Triggers the slam/flash/flatline/roll-up. Ignores duplicate triggers mid-slam. */
  enter(): void {
    if (!this.intro.done) return
    this.intro.enter()
  }

  render(ctx: RenderContext): void {
    const { cols, rows, deltaMs, elapsedMs } = ctx
    this.intro.advance(deltaMs)
    const p = this.intro.progress

    this.renderFlash(ctx, cols, rows, p)
    this.renderTitle(ctx, cols, elapsedMs, p)
    this.renderFlatline(ctx, cols, elapsedMs, p)
    this.renderScore(ctx, cols, p)
    drawCorners(ctx, 0.3 * (0.3 + 0.7 * p), CORNER_COLOR)
  }

  /** A violent full-screen red bloom at the very start of the intro. */
  private renderFlash(ctx: RenderContext, cols: number, rows: number, p: number): void {
    if (p >= FLASH_FRACTION) return
    const b = FLASH_BRIGHT * (1 - p / FLASH_FRACTION)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) setPixel(ctx, x, y, b, FLASH_COLOR)
    }
  }

  private renderTitle(ctx: RenderContext, cols: number, elapsedMs: number, p: number): void {
    const drop = Math.round((1 - p) * TITLE_SLAM_RISE)
    const shake = p < TITLE_SHAKE_END ? (1 - p / TITLE_SHAKE_END) * TITLE_SHAKE : 0
    const jitterX = shake > 0 ? Math.round((Math.random() - 0.5) * 2 * shake) : 0
    const jitterY = shake > 0 ? Math.round((Math.random() - 0.5) * 2 * shake) : 0

    // Glitch only once settled — the slam already provides the entry chaos.
    const glitching = this.intro.done && elapsedMs % GLITCH_PERIOD_MS < GLITCH_DURATION_MS

    const pulse = 0.85 + 0.15 * Math.sin(elapsedMs / TITLE_PULSE_MS)
    const bright = Math.min(1, (0.35 + 0.65 * p) * pulse)

    this.drawTitleLine(ctx, cols, "GAME", GAME_Y - drop + jitterY, jitterX, bright, glitching)
    this.drawTitleLine(ctx, cols, "OVER", OVER_Y - drop + jitterY, jitterX, bright, glitching)
  }

  private drawTitleLine(
    ctx: RenderContext,
    cols: number,
    text: string,
    y: number,
    xOffset: number,
    bright: number,
    glitching: boolean,
  ): void {
    const width = measureStringScaled(text, TITLE_SCALE, TITLE_SPACING)
    const x = Math.floor((cols - width) / 2) + xOffset
    if (glitching) {
      // Chromatic split: dim ghosts either side of the body.
      drawStringScaled(
        ctx,
        text,
        x - GLITCH_OFFSET,
        y,
        TITLE_SCALE,
        TITLE_SPACING,
        bright * 0.5,
        GHOST_DARK,
      )
      drawStringScaled(
        ctx,
        text,
        x + GLITCH_OFFSET,
        y,
        TITLE_SCALE,
        TITLE_SPACING,
        bright * 0.5,
        GHOST_HOT,
      )
    }
    drawStringScaled(ctx, text, x, y, TITLE_SCALE, TITLE_SPACING, bright, TITLE_COLOR)
  }

  /** Flat red baseline; during the intro a final heartbeat spike collapses into it. */
  private renderFlatline(ctx: RenderContext, cols: number, elapsedMs: number, p: number): void {
    const flicker = 0.85 + 0.15 * Math.sin(elapsedMs / FLATLINE_FLICKER_MS)
    const base = FLATLINE_BASE * (0.4 + 0.6 * p) * flicker
    const x0 = FLATLINE_MARGIN
    const x1 = cols - FLATLINE_MARGIN
    for (let x = x0; x < x1; x++) setPixel(ctx, x, FLATLINE_Y, base, BEAT_COLOR)

    const beatT = p / BEAT_END
    if (beatT >= 1) return
    const amp = Math.round((1 - beatT) * BEAT_AMP)
    if (amp <= 0) return
    const cx = Math.floor(cols / 2)
    const spike = Math.min(1, base + 0.55)
    // A ∧ peak: rising edge into cx, falling edge out — shrinks to flat as the intro runs.
    for (let i = 0; i <= amp; i++) {
      setPixel(ctx, cx - amp + i, FLATLINE_Y - i, spike, BEAT_COLOR)
      setPixel(ctx, cx + amp - i, FLATLINE_Y - i, spike, BEAT_COLOR)
    }
  }

  private renderScore(ctx: RenderContext, cols: number, p: number): void {
    const shown = Math.round(this.finalScore * p) // roll up 0 → final with the slam
    const text = formatScore(shown)
    const fit = fitScore(text, SCORE_MAX_WIDTH, SCORE_SCALE_MAX)
    const width = measureScore(text, fit.scale, fit.spacing)
    const x = Math.floor((cols - width) / 2)
    const bright = 0.35 + 0.65 * p
    const ghost = bright * 0.45
    // Same chromatic-aberration treatment as the score scene, tinted red.
    drawScore(ctx, text, x - 1, SCORE_Y, fit.scale, ghost, fit.spacing, GHOST_DARK)
    drawScore(ctx, text, x + 1, SCORE_Y, fit.scale, ghost * 0.9, fit.spacing, GHOST_HOT)
    drawScore(ctx, text, x, SCORE_Y, fit.scale, bright, fit.spacing, SCORE_BODY)
  }
}
