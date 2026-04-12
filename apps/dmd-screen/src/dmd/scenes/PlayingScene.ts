import type { RenderContext, Scene } from "../types"
import { setPixel } from "../buffer"
import { drawString } from "../font"
import { drawBigString, measureBigString } from "../font-big"
import { drawHearts } from "../icons"

const MAX_BALLS = 3
const SCORE_FLASH_MS = 300
const DOT_ROW_PULSE_HZ = 1

export interface PlayingData {
  score: number
  player: number
  totalPlayers: number
  ballNumber: number
}

export class PlayingScene implements Scene {
  private data: PlayingData = { score: 0, player: 1, totalPlayers: 1, ballNumber: 1 }
  private prevScore = 0
  private scoreChangedAt = 0

  update(data: Partial<PlayingData>): void {
    if (data.score !== undefined && data.score !== this.data.score) {
      this.prevScore = this.data.score
      this.scoreChangedAt = Date.now()
    }
    Object.assign(this.data, data)
  }

  render(ctx: RenderContext): void {
    const { buffer, cols, rows, elapsedMs } = ctx
    const { score, player, ballNumber } = this.data

    // Top/bottom dot row pulse at 1Hz
    const pulse = 0.15 + 0.15 * Math.sin((elapsedMs / 1000) * DOT_ROW_PULSE_HZ * 2 * Math.PI)
    for (let col = 0; col < cols; col += 2) {
      setPixel(buffer, cols, col, 0, pulse)
      setPixel(buffer, cols, col, rows - 1, pulse)
    }

    // Score: flash 50ms on/off for SCORE_FLASH_MS after a change
    const timeSinceChange = Date.now() - this.scoreChangedAt
    const isFlashing = timeSinceChange < SCORE_FLASH_MS
    const scoreFlash = isFlashing ? (Math.floor(timeSinceChange / 50) % 2 === 0 ? 1.0 : 0.5) : 1.0

    const scoreText = String(score).padStart(6, "0")
    const scoreWidth = measureBigString(scoreText)
    const scoreX = Math.floor((cols - scoreWidth) / 2)
    const scoreY = Math.floor(rows * 0.15)
    drawBigString(buffer, cols, scoreText, scoreX, scoreY, 2, scoreFlash)

    // Player info — bottom left
    const playerText = "PLAYER " + String(player)
    const infoY = scoreY + 18
    drawString(buffer, cols, playerText, Math.floor(cols * 0.1), infoY)

    // Lives — bottom right as hearts
    const livesRemaining = MAX_BALLS - ballNumber + 1
    const heartSpacing = 7
    const heartsWidth = MAX_BALLS * heartSpacing - 2
    const heartsX = Math.floor(cols * 0.9) - heartsWidth
    drawHearts(buffer, cols, heartsX, infoY, livesRemaining, MAX_BALLS)
  }
}
