import type { RenderContext, Scene } from "../types"
import { setPixel } from "../buffer"
import type { DotBuffer } from "../types"
import { drawString, measureString } from "../font"
import { drawBigString, measureBigString } from "../font-big"

const MAX_BALLS = 3

// 5×5 pixel heart icon. Bit 4 = leftmost pixel.
const HEART_BITMAP = [0b01010, 0b11111, 0b11111, 0b01110, 0b00100]

function drawHeart(
  buffer: DotBuffer,
  cols: number,
  x: number,
  y: number,
  brightness: number,
): void {
  for (let row = 0; row < HEART_BITMAP.length; row++) {
    const bits = HEART_BITMAP[row] ?? 0
    for (let col = 0; col < 5; col++) {
      if (bits & (1 << (4 - col))) {
        setPixel(buffer, cols, x + col, y + row, brightness)
      }
    }
  }
}

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

    // Player info
    const playerText = "PLAYER " + String(player)
    const playerX = Math.floor(cols * 0.1)
    const infoY = scoreY + 18
    drawString(buffer, cols, playerText, playerX, infoY)

    // Lives display: filled hearts for remaining, dim for lost
    const livesRemaining = MAX_BALLS - ballNumber + 1
    const heartSpacing = 7 // 5px wide + 2px gap
    const heartsWidth = MAX_BALLS * heartSpacing - 2
    const heartsX = Math.floor(cols * 0.9) - heartsWidth
    for (let i = 0; i < MAX_BALLS; i++) {
      const hx = heartsX + i * heartSpacing
      const brightness = i < livesRemaining ? 1.0 : 0.15
      drawHeart(buffer, cols, hx, infoY, brightness)
    }

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
