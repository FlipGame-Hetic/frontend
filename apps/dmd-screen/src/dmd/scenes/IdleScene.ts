import type { RenderContext, Scene } from "../types"
import type { ColorInput } from "../palette"
import { drawStringCentered, drawStringScaled, measureStringScaled } from "../font"
import { drawCorners } from "../frame"
import { blink } from "../anim"
import {
  TITLE,
  TITLE_Y,
  TITLE_SCALE,
  TITLE_SPACING,
  GLITCH_PERIOD_MS,
  GLITCH_DURATION_MS,
  GLITCH_STEP_MS,
  GLITCH_OFFSET,
  FLASH_PERIOD_MS,
  FLASH_ON_MS,
  FLASH_GAP_MS,
  PROMPT,
  PROMPT_Y,
  PROMPT_BLINK_MS,
  PROMPT_BRIGHT,
  BRACKET_BASE,
  BRACKET_SWING,
  BRACKET_GLOW_MS,
} from "./idleSceneConfig"

// Cyberpunk 2077 logo palette: acid-yellow face over a light-blue relief shadow
const ACID_YELLOW = "#fdf500"
const UNDER_BLUE = "#54c8ff"
const SURGE_WHITE = "#f4ffff"
const PROMPT_COLOR = "orange" // classic pinball prompt, old-school orange
const BRACKET_COLOR = "cyan"

/**
 * CP2077 title face: acid-yellow base with a quick white flash on the neon
 * double-blink and during a glitch power-surge.
 */
function titleColor(elapsedMs: number, glitching: boolean): ColorInput {
  const phase = elapsedMs % FLASH_PERIOD_MS
  const flashing =
    glitching ||
    phase < FLASH_ON_MS ||
    (phase >= FLASH_GAP_MS && phase < FLASH_GAP_MS + FLASH_ON_MS)
  return flashing ? SURGE_WHITE : ACID_YELLOW
}

/**
 * The cyberpunk attract screen: a glitchy chromatic-aberration "S.P.A.M.E.R."
 * logo (as on the backglass) and a blinking old-school orange "INSÉRER CRÉDIT"
 * prompt, framed by glowing corner brackets. Pure time-derived motion.
 */
export class IdleScene implements Scene {
  render(ctx: RenderContext): void {
    const { elapsedMs } = ctx

    this.renderTitle(ctx, ctx.cols, elapsedMs)
    if (blink(elapsedMs, PROMPT_BLINK_MS)) {
      drawStringCentered(ctx, PROMPT, PROMPT_Y, 1, PROMPT_BRIGHT, PROMPT_COLOR)
    }
    this.renderCorners(ctx, elapsedMs)
  }

  private renderTitle(ctx: RenderContext, cols: number, elapsedMs: number): void {
    const width = measureStringScaled(TITLE, TITLE_SCALE, TITLE_SPACING)
    const glitchPhase = elapsedMs % GLITCH_PERIOD_MS
    const glitching = glitchPhase < GLITCH_DURATION_MS
    const offset = glitching
      ? Math.floor(glitchPhase / GLITCH_STEP_MS) % 2 === 0
        ? GLITCH_OFFSET
        : -GLITCH_OFFSET
      : 0
    const x = Math.floor((cols - width) / 2) + offset

    // Light-blue relief shadow offset down-left, widening on glitch; yellow face on top.
    const dx = glitching ? -2 : -1
    const dy = glitching ? 2 : 1
    const underBright = glitching ? 0.95 : 0.6
    drawStringScaled(
      ctx,
      TITLE,
      x + dx,
      TITLE_Y + dy,
      TITLE_SCALE,
      TITLE_SPACING,
      underBright,
      UNDER_BLUE,
    )
    drawStringScaled(
      ctx,
      TITLE,
      x,
      TITLE_Y,
      TITLE_SCALE,
      TITLE_SPACING,
      1.0,
      titleColor(elapsedMs, glitching),
    )
  }

  private renderCorners(ctx: RenderContext, elapsedMs: number): void {
    const swing = 0.5 + 0.5 * Math.sin(elapsedMs / BRACKET_GLOW_MS)
    drawCorners(ctx, BRACKET_BASE + BRACKET_SWING * swing, BRACKET_COLOR)
  }
}
