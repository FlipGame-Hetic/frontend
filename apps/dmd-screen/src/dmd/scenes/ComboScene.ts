import type { ComboDirection } from "@frontend/types"
import type { RenderContext, Scene } from "../types"
import { setPixel } from "../buffer"
import { drawStringScaledCentered } from "../font"
import { blink } from "../anim"
import { drawCorners } from "../frame"

const COMBO_SCALE = 3
const COMBO_SPACING = 2
const ARROW_W = 5
const ARROW_GAP = 2

function drawLeftArrow(buffer: Float32Array, cols: number, x: number, y: number): void {
  setPixel(buffer, cols, x + 2, y, 1.0)
  setPixel(buffer, cols, x + 1, y + 1, 1.0)
  setPixel(buffer, cols, x, y + 2, 1.0)
  setPixel(buffer, cols, x + 1, y + 3, 1.0)
  setPixel(buffer, cols, x + 2, y + 4, 1.0)
  setPixel(buffer, cols, x + 3, y + 1, 0.5)
  setPixel(buffer, cols, x + 4, y + 1, 0.5)
  setPixel(buffer, cols, x + 3, y + 3, 0.5)
  setPixel(buffer, cols, x + 4, y + 3, 0.5)
}

function drawRightArrow(buffer: Float32Array, cols: number, x: number, y: number): void {
  setPixel(buffer, cols, x + 2, y, 1.0)
  setPixel(buffer, cols, x + 3, y + 1, 1.0)
  setPixel(buffer, cols, x + 4, y + 2, 1.0)
  setPixel(buffer, cols, x + 3, y + 3, 1.0)
  setPixel(buffer, cols, x + 2, y + 4, 1.0)
  setPixel(buffer, cols, x, y + 1, 0.5)
  setPixel(buffer, cols, x + 1, y + 1, 0.5)
  setPixel(buffer, cols, x, y + 3, 0.5)
  setPixel(buffer, cols, x + 1, y + 3, 0.5)
}

export class ComboScene implements Scene {
  private sequence: ComboDirection[] | null = null

  update(data: { sequence?: ComboDirection[] }): void {
    this.sequence = data.sequence ?? null
  }

  render(ctx: RenderContext): void {
    const { buffer, cols, rows, elapsedMs } = ctx

    const contentH = COMBO_SCALE * 7 + 6 + 5
    const comboY = Math.floor((rows - contentH) / 2)

    if (blink(elapsedMs, 350)) {
      drawStringScaledCentered(buffer, cols, "COMBO", comboY, COMBO_SCALE, COMBO_SPACING, 1.0)
    }

    if (this.sequence) {
      const sequence = this.sequence
      const totalW = sequence.length * ARROW_W + (sequence.length - 1) * ARROW_GAP
      let arrowX = Math.floor((cols - totalW) / 2)
      const arrowY = comboY + COMBO_SCALE * 7 + 6

      for (const side of sequence) {
        if (side === "L") {
          drawLeftArrow(buffer, cols, arrowX, arrowY)
        } else {
          drawRightArrow(buffer, cols, arrowX, arrowY)
        }
        arrowX += ARROW_W + ARROW_GAP
      }
    }

    drawCorners(buffer, cols, rows)
  }
}
