import type { RenderContext, Scene } from "../types"
import { setPixel } from "../buffer"
import { drawStringScaled, measureStringScaled } from "../font"

type Side = "L" | "R"

const COMBO_SEQUENCES: Record<number, Side[]> = {
  1: ["L", "L", "R", "R"],
  2: ["L", "L", "R", "R", "L"],
  3: ["L", "L", "R", "R", "R", "R"],
  4: ["L", "L", "R", "R", "R", "L"],
  5: ["L", "L", "R", "L", "L", "R"],
  6: ["L", "L", "R", "R", "L", "L", "R"],
  7: ["L", "L", "R", "L", "R", "L", "L"],
  8: ["R", "R", "R", "L", "L", "R", "L"],
  12: ["R", "R", "R", "L"],
  13: ["R", "R", "L"],
}

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
  private comboId = 0

  update(data: { comboId: number }): void {
    this.comboId = data.comboId
  }

  render(ctx: RenderContext): void {
    const { buffer, cols, rows, elapsedMs } = ctx

    const blink = Math.floor(elapsedMs / 350) % 2 === 0

    const comboText = "COMBO"
    const comboW = measureStringScaled(comboText, COMBO_SCALE, COMBO_SPACING)
    const comboX = Math.floor((cols - comboW) / 2)
    const contentH = COMBO_SCALE * 7 + 6 + 5
    const comboY = Math.floor((rows - contentH) / 2)

    if (blink) {
      drawStringScaled(buffer, cols, comboText, comboX, comboY, COMBO_SCALE, COMBO_SPACING, 1.0)
    }

    const sequence = COMBO_SEQUENCES[this.comboId]
    if (sequence) {
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

    for (let i = 0; i < 3; i++) {
      setPixel(buffer, cols, i, 0, 0.3)
      setPixel(buffer, cols, cols - 1 - i, 0, 0.3)
      setPixel(buffer, cols, i, rows - 1, 0.3)
      setPixel(buffer, cols, cols - 1 - i, rows - 1, 0.3)
    }
  }
}
