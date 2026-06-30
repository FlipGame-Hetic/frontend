import type { RenderContext, Scene } from "../types"
import { drawStringCentered } from "../font"
import { blink } from "../anim"
import { TITLE_Y_RATIO, VALUE_Y_RATIO, HINT, HINT_BRIGHTNESS } from "./selectSceneConfig"

/**
 * Generic "choose one thing" menu screen. Shows a title, the currently-selected
 * value (blinking) and a dim hint. Used for both mode and character selection —
 * they differ only in title text and blink rate.
 */
export class SelectScene implements Scene {
  private value = ""

  constructor(
    private readonly title: string,
    private readonly blinkPeriodMs: number,
  ) {}

  update(value: string): void {
    this.value = value.toUpperCase()
  }

  render({ buffer, cols, rows, elapsedMs }: RenderContext): void {
    drawStringCentered(buffer, cols, this.title, Math.floor(rows * TITLE_Y_RATIO))

    if (this.value && blink(elapsedMs, this.blinkPeriodMs)) {
      drawStringCentered(buffer, cols, this.value, Math.floor(rows * VALUE_Y_RATIO))
    }

    drawStringCentered(buffer, cols, HINT, rows - 10, 1, HINT_BRIGHTNESS)
  }
}
