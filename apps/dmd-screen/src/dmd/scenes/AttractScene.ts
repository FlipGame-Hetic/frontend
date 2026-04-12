import type { RenderContext, Scene } from "../types"
import { setPixel } from "../buffer"
import { drawString, measureString } from "../font"
import { drawBigChar, measureBigString } from "../font-big"

const TITLE = "FLIPPER"
const BIG_CHAR_STRIDE = 12 // 10px wide + 2px spacing
const CYCLE_MS = 2500

export class AttractScene implements Scene {
  render(ctx: RenderContext): void {
    const { buffer, cols, rows, elapsedMs } = ctx

    // Sequential letter reveal: each letter fades in 250ms after previous,
    // all hold bright, then all fade out together in last 200ms of cycle
    const t = elapsedMs % CYCLE_MS
    const holdEnd = CYCLE_MS - 200

    const titleWidth = measureBigString(TITLE)
    const titleX = Math.floor((cols - titleWidth) / 2)
    const titleY = Math.floor(rows * 0.2)

    for (let i = 0; i < TITLE.length; i++) {
      const fadeInStart = i * 250
      const fadeInEnd = fadeInStart + 200

      let brightness: number
      if (t < fadeInStart) {
        brightness = 0.08
      } else if (t < fadeInEnd) {
        brightness = 0.08 + 0.92 * ((t - fadeInStart) / 200)
      } else if (t < holdEnd) {
        brightness = 1.0
      } else {
        brightness = Math.max(0, 1.0 - (t - holdEnd) / 200)
      }

      const char = TITLE[i] ?? " "
      drawBigChar(buffer, cols, char, titleX + i * BIG_CHAR_STRIDE, titleY, brightness)
    }

    // INSERT COIN blink — 500ms on/off
    const blink = Math.floor(elapsedMs / 500) % 2 === 0
    if (blink) {
      const text = "INSERT COIN"
      const w = measureString(text)
      drawString(buffer, cols, text, Math.floor((cols - w) / 2), rows - 10)
    }

    // Corner decorations
    for (let i = 0; i < 3; i++) {
      setPixel(buffer, cols, i, 0, 0.3)
      setPixel(buffer, cols, cols - 1 - i, 0, 0.3)
      setPixel(buffer, cols, i, rows - 1, 0.3)
      setPixel(buffer, cols, cols - 1 - i, rows - 1, 0.3)
    }
  }
}
