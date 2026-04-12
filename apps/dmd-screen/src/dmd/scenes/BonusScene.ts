import type { RenderContext, Scene } from "../types"
import { drawString, measureString } from "../font"
import { drawBigString, measureBigString } from "../font-big"

export interface BonusData {
  score: number
  player: number
}

export class BonusScene implements Scene {
  private data: BonusData = { score: 0, player: 1 }
  private displayScore = 0

  update(data: Partial<BonusData>): void {
    Object.assign(this.data, data)
  }

  render(ctx: RenderContext): void {
    const { buffer, cols, rows, deltaMs, elapsedMs } = ctx
    const { score, player } = this.data

    // Tick displayScore toward actual score — fast ticking for bonus feel
    if (this.displayScore < score) {
      const step = Math.max(1, Math.floor((score - this.displayScore) * 0.15))
      this.displayScore = Math.min(score, this.displayScore + step)
    }

    // "BONUS" label pulsing
    const bonusPulse = 0.7 + 0.3 * Math.sin((elapsedMs / 400) * Math.PI)
    const bonusText = "BONUS"
    const bw = measureString(bonusText)
    drawString(buffer, cols, bonusText, Math.floor((cols - bw) / 2), 12, 1, bonusPulse)

    // Big score ticking up
    const scoreText = String(this.displayScore).padStart(6, "0")
    const sw = measureBigString(scoreText)
    drawBigString(buffer, cols, scoreText, Math.floor((cols - sw) / 2), 26)

    // Player label
    const playerText = "PLAYER " + String(player)
    const pw = measureString(playerText)
    drawString(buffer, cols, playerText, Math.floor((cols - pw) / 2), rows - 10, 1, 0.5)

    // Suppress unused warning
    void deltaMs
  }

  enter(): void {
    this.displayScore = 0
  }
}
