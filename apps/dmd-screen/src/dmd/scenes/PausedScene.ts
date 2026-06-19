import type { RenderContext, Scene } from "../types"
import { drawStringCentered } from "../font"

export class PausedScene implements Scene {
  render({ buffer, cols, rows }: RenderContext): void {
    drawStringCentered(buffer, cols, "PAUSED", Math.floor(rows / 2) - 4)
  }
}
