import type { RenderContext, Scene } from "../types"
import { drawStringCentered, drawStringScaledCentered } from "../font"
import { blink } from "../anim"
import { drawCorners } from "../frame"

const SCORE_SCALE = 2
const SCORE_SPACING = 2

export class GameOverScene implements Scene {
  private score = 0

  update(score: number): void {
    this.score = score
  }

  render({ buffer, cols, rows, elapsedMs }: RenderContext): void {
    if (blink(elapsedMs, 500)) {
      drawStringCentered(buffer, cols, "GAME OVER", Math.floor(rows * 0.1))
    }

    const scoreText = String(this.score).padStart(6, "0")
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
