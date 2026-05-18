import type { RenderContext, Scene } from "../types"
import { drawString, measureString } from "../font"

export class ModeSelectScene implements Scene {
  private mode = ""

  update(mode: string): void {
    this.mode = mode.toUpperCase()
  }

  render({ buffer, cols, rows, elapsedMs }: RenderContext): void {
    const title = "SELECT MODE"
    const titleW = measureString(title)
    drawString(buffer, cols, title, Math.floor((cols - titleW) / 2), Math.floor(rows * 0.15))

    if (this.mode) {
      const blink = Math.floor(elapsedMs / 600) % 2 === 0
      if (blink) {
        const modeW = measureString(this.mode)
        drawString(buffer, cols, this.mode, Math.floor((cols - modeW) / 2), Math.floor(rows * 0.55))
      }
    }

    const hint = "< SELECT >"
    const hintW = measureString(hint)
    drawString(buffer, cols, hint, Math.floor((cols - hintW) / 2), rows - 10, 1, 0.4)
  }
}
