import type { RenderContext, Scene } from "../types"
import { drawStringCentered, drawStringScaledCentered } from "../font"
import { blink } from "../anim"
import { drawCorners } from "../frame"
import { padScore } from "@frontend/utils"
import { SCORE_SCALE, SCORE_SPACING } from "./gameOverSceneConfig"

export class GameOverScene implements Scene {
  private score = 0

  update(score: number): void {
    this.score = score
  }

  render(ctx: RenderContext): void {
    const { rows, elapsedMs } = ctx
    if (blink(elapsedMs, 500)) {
      drawStringCentered(ctx, "GAME OVER", Math.floor(rows * 0.1))
    }

    const scoreText = padScore(this.score)
    drawStringScaledCentered(ctx, scoreText, Math.floor(rows * 0.4), SCORE_SCALE, SCORE_SPACING)

    drawCorners(ctx)
  }
}
