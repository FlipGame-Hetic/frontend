import type { RenderContext, Scene } from "../types"
import { setPixel } from "../buffer"
import { drawString, measureString } from "../font"
import { drawBigString, measureBigString } from "../font-big"

const FLASH_INTERVAL_MS = 100

export class TiltScene implements Scene {
  render(ctx: RenderContext): void {
    const { buffer, cols, rows, elapsedMs } = ctx

    // Hard flash: 100ms on/off
    const isOn = Math.floor(elapsedMs / FLASH_INTERVAL_MS) % 2 === 0
    if (!isOn) return

    // Screen shake via deterministic oscillation
    const shakeX = Math.round(Math.sin(elapsedMs * 0.08) * 2)
    const shakeY = Math.round(Math.cos(elapsedMs * 0.13) * 1)

    const tiltText = "TILT"
    const tw = measureBigString(tiltText)
    const tx = Math.floor((cols - tw) / 2) + shakeX
    const ty = Math.floor((rows - 14) / 2) + shakeY
    drawBigString(buffer, cols, tiltText, tx, ty)

    const penaltyText = "PENALTY!"
    const pw = measureString(penaltyText)
    drawString(buffer, cols, penaltyText, Math.floor((cols - pw) / 2) + shakeX, rows - 10 + shakeY)

    // Shaking border dots
    for (let i = 0; i < cols; i += 4) {
      setPixel(buffer, cols, i + shakeX, shakeY, 0.4)
      setPixel(buffer, cols, i + shakeX, rows - 1 + shakeY, 0.4)
    }
    for (let i = 0; i < rows; i += 4) {
      setPixel(buffer, cols, shakeX, i + shakeY, 0.4)
      setPixel(buffer, cols, cols - 1 + shakeX, i + shakeY, 0.4)
    }
  }
}
