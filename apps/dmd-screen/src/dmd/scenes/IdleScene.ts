import type { RenderContext, Scene } from "../types"
import { drawString, measureString } from "../font"
import { setPixel } from "../buffer"

export class IdleScene implements Scene {
  render({ buffer, cols, rows, elapsedMs }: RenderContext): void {
    const titleText = "S.P.A.M.E.R."
    const titleW = measureString(titleText)
    drawString(buffer, cols, titleText, Math.floor((cols - titleW) / 2), Math.floor(rows * 0.2))

    const blink = Math.floor(elapsedMs / 500) % 2 === 0
    if (blink) {
      const text = "INSERT COIN"
      const w = measureString(text)
      drawString(buffer, cols, text, Math.floor((cols - w) / 2), rows - 10)
    }

    for (let i = 0; i < 3; i++) {
      setPixel(buffer, cols, i, 0, 0.3)
      setPixel(buffer, cols, cols - 1 - i, 0, 0.3)
      setPixel(buffer, cols, i, rows - 1, 0.3)
      setPixel(buffer, cols, cols - 1 - i, rows - 1, 0.3)
    }
  }
}
