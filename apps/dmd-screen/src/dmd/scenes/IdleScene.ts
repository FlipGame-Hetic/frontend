import type { RenderContext, Scene } from "../types"
import { drawStringCentered } from "../font"
import { blink } from "../anim"
import { drawCorners } from "../frame"

export class IdleScene implements Scene {
  render(ctx: RenderContext): void {
    const { rows, elapsedMs } = ctx
    drawStringCentered(ctx, "S.P.A.M.E.R.", Math.floor(rows * 0.2))

    if (blink(elapsedMs, 500)) {
      drawStringCentered(ctx, "INSERT COIN", rows - 10)
    }

    drawCorners(ctx)
  }
}
