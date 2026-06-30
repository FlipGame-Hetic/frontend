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

  render({ buffer, cols, rows, elapsedMs }: RenderContext): void {
    if (blink(elapsedMs, 500)) {
      drawStringCentered(buffer, cols, "GAME OVER", Math.floor(rows * 0.1))
    }

    const scoreText = padScore(this.score)
    drawStringScaledCentered(
      buffer,
      cols,
      scoreText,
      Math.floor(rows * 0.4),
      SCORE_SCALE,
      SCORE_SPACING,
    )

    drawCorners(buffer, cols, rows)
  }
}
