import type { RenderContext, Scene } from "../types"
import { setPixel } from "../buffer"
import { drawString, measureString } from "../font"
import { drawHearts } from "../icons"

const MAX_BALLS = 3

export interface StartData {
  player: number
  totalPlayers: number
}

export class StartScene implements Scene {
  private data: StartData = { player: 1, totalPlayers: 1 }
  private enteredAt = 0

  update(data: Partial<StartData>): void {
    Object.assign(this.data, data)
  }

  enter(): void {
    this.enteredAt = Date.now()
  }

  render(ctx: RenderContext): void {
    const { buffer, cols, rows } = ctx
    const localMs = Date.now() - this.enteredAt
    const { player } = this.data

    // Horizontal wipe line sweeps left→right over 500ms
    const wipeProgress = Math.min(1, localMs / 500)
    const wipeX = Math.floor(wipeProgress * (cols - 1))
    for (let y = 0; y < rows; y++) {
      setPixel(buffer, cols, wipeX, y, 0.6)
    }

    // Content fades in starting at 400ms
    const alpha = Math.max(0, Math.min(1, (localMs - 400) / 400))
    if (alpha <= 0) return

    const playerText = "PLAYER " + String(player)
    const pw = measureString(playerText)
    drawString(
      buffer,
      cols,
      playerText,
      Math.floor((cols - pw) / 2),
      Math.floor(rows * 0.3),
      1,
      alpha,
    )

    const readyText = "READY TO PLAY"
    const rw = measureString(readyText)
    drawString(
      buffer,
      cols,
      readyText,
      Math.floor((cols - rw) / 2),
      Math.floor(rows * 0.48),
      1,
      alpha,
    )

    // 3 hearts centered (representing full lives at game start)
    const heartSpacing = 7
    const heartsWidth = MAX_BALLS * heartSpacing - 2
    const heartsX = Math.floor((cols - heartsWidth) / 2)
    drawHearts(buffer, cols, heartsX, Math.floor(rows * 0.68), MAX_BALLS, MAX_BALLS, alpha, 0)
  }
}
