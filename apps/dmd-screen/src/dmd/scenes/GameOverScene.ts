import type { RenderContext, Scene } from "../types"
import { drawString, measureString } from "../font"
import { drawBigString, measureBigString } from "../font-big"

const SCROLL_DURATION_MS = 700
const ROLL_START_MS = 600
const ROLL_DURATION_MS = 1800

export interface GameOverData {
  score: number
  player: number
}

export class GameOverScene implements Scene {
  private data: GameOverData = { score: 0, player: 1 }
  private enteredAt = 0

  update(data: Partial<GameOverData>): void {
    Object.assign(this.data, data)
  }

  enter(): void {
    this.enteredAt = Date.now()
  }

  render(ctx: RenderContext): void {
    const { buffer, cols, rows } = ctx
    const localMs = Date.now() - this.enteredAt
    const { score, player } = this.data

    // "GAME" scrolls in from right over SCROLL_DURATION_MS
    const gameText = "GAME"
    const overText = "OVER"
    const gw = measureBigString(gameText)
    const ow = measureBigString(overText)
    const targetX = Math.floor((cols - gw) / 2)

    const scrollT = Math.min(1, localMs / SCROLL_DURATION_MS)
    // Ease out cubic
    const ease = 1 - Math.pow(1 - scrollT, 3)
    const currentX = Math.floor(cols + (targetX - cols) * ease)

    drawBigString(buffer, cols, gameText, currentX, 8)
    drawBigString(buffer, cols, overText, Math.floor((cols - ow) / 2), 26)

    // Score rolls up from 0 to final value
    const rollT = Math.max(0, Math.min(1, (localMs - ROLL_START_MS) / ROLL_DURATION_MS))
    const displayScore = Math.floor(score * rollT)
    const scoreText = String(displayScore).padStart(6, "0")
    const sw = measureBigString(scoreText)
    drawBigString(buffer, cols, scoreText, Math.floor((cols - sw) / 2), 50)

    // Player label (fades in with score)
    if (rollT > 0) {
      const playerText = "PLAYER " + String(player)
      const pw = measureString(playerText)
      drawString(
        buffer,
        cols,
        playerText,
        Math.floor((cols - pw) / 2),
        rows - 10,
        1,
        Math.min(1, rollT * 2),
      )
    }
  }
}
