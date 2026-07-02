import type { ComboDirection } from "@frontend/types"
import type { DotSurface, RenderContext, Scene } from "../types"
import { setPixel } from "../buffer"
import { drawStringScaledCentered } from "../font"
import { blink } from "../anim"
import { drawCorners } from "../frame"
import { COMBO_SCALE, COMBO_SPACING, ARROW_W, ARROW_GAP } from "./comboSceneConfig"

function drawLeftArrow(s: DotSurface, x: number, y: number): void {
  setPixel(s, x + 2, y, 1.0)
  setPixel(s, x + 1, y + 1, 1.0)
  setPixel(s, x, y + 2, 1.0)
  setPixel(s, x + 1, y + 3, 1.0)
  setPixel(s, x + 2, y + 4, 1.0)
  setPixel(s, x + 3, y + 1, 0.5)
  setPixel(s, x + 4, y + 1, 0.5)
  setPixel(s, x + 3, y + 3, 0.5)
  setPixel(s, x + 4, y + 3, 0.5)
}

function drawRightArrow(s: DotSurface, x: number, y: number): void {
  setPixel(s, x + 2, y, 1.0)
  setPixel(s, x + 3, y + 1, 1.0)
  setPixel(s, x + 4, y + 2, 1.0)
  setPixel(s, x + 3, y + 3, 1.0)
  setPixel(s, x + 2, y + 4, 1.0)
  setPixel(s, x, y + 1, 0.5)
  setPixel(s, x + 1, y + 1, 0.5)
  setPixel(s, x, y + 3, 0.5)
  setPixel(s, x + 1, y + 3, 0.5)
}

export class ComboScene implements Scene {
  private sequence: ComboDirection[] | null = null

  update(data: { sequence?: ComboDirection[] }): void {
    this.sequence = data.sequence ?? null
  }

  render(ctx: RenderContext): void {
    const { cols, rows, elapsedMs } = ctx

    const contentH = COMBO_SCALE * 7 + 6 + 5
    const comboY = Math.floor((rows - contentH) / 2)

    if (blink(elapsedMs, 350)) {
      drawStringScaledCentered(ctx, "COMBO", comboY, COMBO_SCALE, COMBO_SPACING, 1.0)
    }

    if (this.sequence) {
      const sequence = this.sequence
      const totalW = sequence.length * ARROW_W + (sequence.length - 1) * ARROW_GAP
      let arrowX = Math.floor((cols - totalW) / 2)
      const arrowY = comboY + COMBO_SCALE * 7 + 6

      for (const side of sequence) {
        if (side === "L") {
          drawLeftArrow(ctx, arrowX, arrowY)
        } else {
          drawRightArrow(ctx, arrowX, arrowY)
        }
        arrowX += ARROW_W + ARROW_GAP
      }
    }

    drawCorners(ctx)
  }
}
