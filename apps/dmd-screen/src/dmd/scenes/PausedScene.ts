import type { RenderContext, Scene } from "../types"
import { drawString, measureString } from "../font"

export class PausedScene implements Scene {
  render({ buffer, cols, rows }: RenderContext): void {
    const text = "PAUSED"
    const w = measureString(text)
    drawString(buffer, cols, text, Math.floor((cols - w) / 2), Math.floor(rows / 2) - 4)
  }
}
