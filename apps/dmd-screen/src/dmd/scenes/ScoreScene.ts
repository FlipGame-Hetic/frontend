import type { RenderContext, Scene } from "../types"
import { setPixel } from "../buffer"
import { drawString, measureString } from "../font"
import { drawBigString, measureBigString } from "../font-big"

export interface ScoreData {
  score: number
  player: number
  totalPlayers: number
  ballNumber: number
  phase: string
}

export class ScoreScene implements Scene {
  private data: ScoreData = {
    score: 0,
    player: 1,
    totalPlayers: 1,
    ballNumber: 1,
    phase: "waiting",
  }

  update(data: Partial<ScoreData>): void {
    Object.assign(this.data, data)
  }

  render(ctx: RenderContext): void {
    const { buffer, cols, rows, elapsedMs } = ctx
    const { score, player, ballNumber, phase } = this.data

    // Large score centered
    const scoreText = String(score).padStart(6, "0")
    const scoreWidth = measureBigString(scoreText)
    const scoreX = Math.floor((cols - scoreWidth) / 2)
    const scoreY = Math.floor(rows * 0.15)
    drawBigString(buffer, cols, scoreText, scoreX, scoreY)

    // Player & ball info
    const playerText = "PLAYER " + String(player)
    const ballText = "BALL " + String(ballNumber)

    const playerX = Math.floor(cols * 0.1)
    const ballWidth = measureString(ballText)
    const ballX = Math.floor(cols * 0.9) - ballWidth

    const infoY = scoreY + 18
    drawString(buffer, cols, playerText, playerX, infoY)
    drawString(buffer, cols, ballText, ballX, infoY)

    // Phase indicator at bottom
    if (phase === "waiting") {
      const blink = Math.floor(elapsedMs / 500) % 2 === 0
      if (blink) {
        const text = "INSERT COIN"
        const w = measureString(text)
        drawString(buffer, cols, text, Math.floor((cols - w) / 2), rows - 10)
      }
    } else if (phase === "paused") {
      const text = "PAUSED"
      const w = measureString(text)
      drawString(buffer, cols, text, Math.floor((cols - w) / 2), rows - 10)
    }

    // Corner decorations
    for (let i = 0; i < 3; i++) {
      setPixel(buffer, cols, i, 0, 0.3)
      setPixel(buffer, cols, cols - 1 - i, 0, 0.3)
      setPixel(buffer, cols, i, rows - 1, 0.3)
      setPixel(buffer, cols, cols - 1 - i, rows - 1, 0.3)
    }
  }
}
