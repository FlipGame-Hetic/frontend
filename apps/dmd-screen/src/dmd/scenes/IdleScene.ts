import type { RenderContext, Scene } from "../types"
import { drawStringCentered } from "../font"
import { blink } from "../anim"
import { drawCorners } from "../frame"

export class IdleScene implements Scene {
  render({ buffer, cols, rows, elapsedMs }: RenderContext): void {
    drawStringCentered(buffer, cols, "S.P.A.M.E.R.", Math.floor(rows * 0.2))

    if (blink(elapsedMs, 500)) {
      drawStringCentered(buffer, cols, "INSERT COIN", rows - 10)
    }

    drawCorners(buffer, cols, rows)
  }
}
