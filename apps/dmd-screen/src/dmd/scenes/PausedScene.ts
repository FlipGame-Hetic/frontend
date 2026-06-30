import type { RenderContext, Scene } from "../types"
import { drawStringCentered } from "../font"

export class PausedScene implements Scene {
  render(ctx: RenderContext): void {
    drawStringCentered(ctx, "PAUSED", Math.floor(ctx.rows / 2) - 4)
  }
}
