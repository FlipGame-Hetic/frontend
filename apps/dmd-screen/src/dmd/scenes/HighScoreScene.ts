import type { RenderContext, Scene } from "../types"
import { setPixel } from "../buffer"
import { drawString, measureString } from "../font"
import { drawBigString, measureBigString } from "../font-big"

const BURST_DURATION_MS = 1500
const NUM_BURST_ANGLES = 16

export interface HighScoreData {
  score: number
  player: number
}

export class HighScoreScene implements Scene {
  private data: HighScoreData = { score: 0, player: 1 }
  private enteredAt = 0

  update(data: Partial<HighScoreData>): void {
    Object.assign(this.data, data)
  }

  enter(): void {
    this.enteredAt = Date.now()
  }

  render(ctx: RenderContext): void {
    const { buffer, cols, rows, elapsedMs } = ctx
    const localMs = Date.now() - this.enteredAt
    const { score, player } = this.data

    const cx = cols / 2
    const cy = rows / 2

    // Star burst: two expanding rings from center
    for (let ring = 0; ring < 2; ring++) {
      const ringOffset = ring * (BURST_DURATION_MS / 2)
      const t = ((localMs - ringOffset) % BURST_DURATION_MS) / BURST_DURATION_MS
      if (t < 0) continue
      const r = t * (cols * 0.55)
      const brightness = Math.max(0, 1.0 - t * 1.2)
      if (brightness <= 0) continue

      for (let i = 0; i < NUM_BURST_ANGLES; i++) {
        const angle = (i / NUM_BURST_ANGLES) * 2 * Math.PI
        const px = Math.round(cx + Math.cos(angle) * r)
        const py = Math.round(cy + Math.sin(angle) * r)
        setPixel(buffer, cols, px, py, brightness)
      }
    }

    // "HIGH SCORE" label
    const labelText = "HIGH SCORE"
    const lw = measureString(labelText)
    drawString(buffer, cols, labelText, Math.floor((cols - lw) / 2), 8)

    // Big score
    const scoreText = String(score).padStart(6, "0")
    const sw = measureBigString(scoreText)
    drawBigString(buffer, cols, scoreText, Math.floor((cols - sw) / 2), 20)

    // "CONGRATULATIONS" blink — 1Hz pulse
    const congratText = "GREAT SCORE!"
    const gw = measureString(congratText)
    const pulse = 0.5 + 0.5 * Math.sin((elapsedMs / 500) * Math.PI)
    drawString(buffer, cols, congratText, Math.floor((cols - gw) / 2), rows - 10, 1, pulse)

    // Player label
    const playerText = "PLAYER " + String(player)
    const pw = measureString(playerText)
    drawString(buffer, cols, playerText, Math.floor((cols - pw) / 2), rows - 20, 1, 0.5)
  }
}
