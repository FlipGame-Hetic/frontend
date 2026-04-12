import type { RenderContext, Scene } from "../types"
import { drawString, measureString } from "../font"
import { drawBigString, measureBigString } from "../font-big"
import { drawHearts } from "../icons"
import { MAX_BALLS, heartsWidth } from "../constants"

const FLASH_DURATION_MS = 600
const FLASH_INTERVAL_MS = 100

export interface BallLostData {
  player: number
  ballNumber: number
}

export class BallLostScene implements Scene {
  private data: BallLostData = { player: 1, ballNumber: 1 }
  private enteredAt = 0

  update(data: Partial<BallLostData>): void {
    Object.assign(this.data, data)
  }

  enter(): void {
    this.enteredAt = Date.now()
  }

  render(ctx: RenderContext): void {
    const { buffer, cols, rows } = ctx
    const localMs = Date.now() - this.enteredAt
    const { player, ballNumber } = this.data

    // "BALL LOST" flashes 3× fast then holds
    let textBrightness: number
    if (localMs < FLASH_DURATION_MS) {
      textBrightness = Math.floor(localMs / FLASH_INTERVAL_MS) % 2 === 0 ? 1.0 : 0.0
    } else {
      textBrightness = 1.0
    }

    const ballText = "BALL"
    const lostText = "LOST"
    const ballW = measureBigString(ballText)
    const lostW = measureBigString(lostText)

    drawBigString(buffer, cols, ballText, Math.floor((cols - ballW) / 2), 12, 2, textBrightness)
    drawBigString(buffer, cols, lostText, Math.floor((cols - lostW) / 2), 30, 2, textBrightness)

    // Remaining lives — hearts pulse gently after flash ends
    const livesRemaining = Math.max(0, MAX_BALLS - ballNumber)
    const heartPulse =
      localMs >= FLASH_DURATION_MS ? 0.6 + 0.4 * Math.sin((localMs / 800) * Math.PI) : 0.0

    const heartsX = Math.floor((cols - heartsWidth(MAX_BALLS)) / 2)
    drawHearts(buffer, cols, heartsX, 52, livesRemaining, MAX_BALLS, heartPulse, heartPulse * 0.15)

    // Player label
    const playerText = "PLAYER " + String(player)
    const pw = measureString(playerText)
    drawString(buffer, cols, playerText, Math.floor((cols - pw) / 2), rows - 10, 1, 0.5)
  }
}
