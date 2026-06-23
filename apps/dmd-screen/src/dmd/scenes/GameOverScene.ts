import type { RenderContext, Scene } from "../types"
import { drawString, measureString } from "../font"
import { drawBigString, measureBigString } from "../font-big"
import { setPixel } from "../buffer"
import { padScore } from "@frontend/utils"

export class GameOverScene implements Scene {
  private score = 0

  update(score: number): void {
    this.score = score
  }

  render({ buffer, cols, rows, elapsedMs }: RenderContext): void {
    const blink = Math.floor(elapsedMs / 500) % 2 === 0
    if (blink) {
      const title = "GAME OVER"
      const titleW = measureString(title)
      drawString(buffer, cols, title, Math.floor((cols - titleW) / 2), Math.floor(rows * 0.1))
    }

    const scoreText = padScore(this.score)
    const scoreW = measureBigString(scoreText)
    drawBigString(buffer, cols, scoreText, Math.floor((cols - scoreW) / 2), Math.floor(rows * 0.4))

    for (let i = 0; i < 3; i++) {
      setPixel(buffer, cols, i, 0, 0.3)
      setPixel(buffer, cols, cols - 1 - i, 0, 0.3)
      setPixel(buffer, cols, i, rows - 1, 0.3)
      setPixel(buffer, cols, cols - 1 - i, rows - 1, 0.3)
    }
  }
}
