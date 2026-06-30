import type { DotSurface } from "./types"
import type { ColorInput } from "./palette"
import { setPixel } from "./buffer"

const CORNER_LEN = 3
const CORNER_BRIGHTNESS = 0.3

/**
 * Draws short arcade-style brackets in each of the four corners of the display.
 * Shared by every full-screen scene to frame the content.
 */
export function drawCorners(
  s: DotSurface,
  brightness = CORNER_BRIGHTNESS,
  color?: ColorInput,
): void {
  const { cols, rows } = s
  for (let i = 0; i < CORNER_LEN; i++) {
    setPixel(s, i, 0, brightness, color)
    setPixel(s, cols - 1 - i, 0, brightness, color)
    setPixel(s, i, rows - 1, brightness, color)
    setPixel(s, cols - 1 - i, rows - 1, brightness, color)
  }
}
