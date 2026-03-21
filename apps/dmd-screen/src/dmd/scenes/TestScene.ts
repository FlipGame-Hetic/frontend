import type { RenderContext, Scene } from "../types"
import { setPixel } from "../buffer"
import { drawString, measureString } from "../font"
import { drawBigString, measureBigString } from "../font-big"

export class TestScene implements Scene {
  private score = 0
  private lastIncrement = 0
  private readonly incrementInterval = 500

  enter(): void {
    this.score = 0
    this.lastIncrement = 0
  }

  render(ctx: RenderContext): void {
    const { buffer, cols, rows, elapsedMs } = ctx

    // Auto-increment score
    if (elapsedMs - this.lastIncrement >= this.incrementInterval) {
      this.score += Math.floor(Math.random() * 4900) + 100
      this.lastIncrement = elapsedMs
    }

    // Draw score with big font, centered
    const scoreText = String(this.score).padStart(6, "0")
    const scoreWidth = measureBigString(scoreText)
    const scoreX = Math.floor((cols - scoreWidth) / 2)
    const scoreY = Math.floor(rows * 0.15)
    drawBigString(buffer, cols, scoreText, scoreX, scoreY)

    // Draw player/ball info with small font, centered
    const infoText = "PLAYER 1   BALL 1"
    const infoWidth = measureString(infoText)
    const infoX = Math.floor((cols - infoWidth) / 2)
    const infoY = scoreY + 16
    drawString(buffer, cols, infoText, infoX, infoY)

    // "TEST MODE" blinking at bottom
    const blink = Math.floor(elapsedMs / 600) % 2 === 0
    if (blink) {
      const testText = "TEST MODE"
      const testWidth = measureString(testText)
      const testX = Math.floor((cols - testWidth) / 2)
      const testY = rows - 10
      drawString(buffer, cols, testText, testX, testY)
    }

    // Decorative dots in corners
    for (let i = 0; i < 3; i++) {
      setPixel(buffer, cols, i, 0, 0.4)
      setPixel(buffer, cols, cols - 1 - i, 0, 0.4)
      setPixel(buffer, cols, i, rows - 1, 0.4)
      setPixel(buffer, cols, cols - 1 - i, rows - 1, 0.4)
    }
  }
}
