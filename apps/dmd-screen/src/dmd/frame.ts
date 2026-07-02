import type { DotBuffer } from "./types"
import { setPixel } from "./buffer"

const CORNER_LEN = 3
const CORNER_BRIGHTNESS = 0.3

/**
 * Draws short arcade-style brackets in each of the four corners of the display.
 * Shared by every full-screen scene to frame the content.
 */
export function drawCorners(
  buffer: DotBuffer,
  cols: number,
  rows: number,
  brightness = CORNER_BRIGHTNESS,
): void {
  for (let i = 0; i < CORNER_LEN; i++) {
    setPixel(buffer, cols, i, 0, brightness)
    setPixel(buffer, cols, cols - 1 - i, 0, brightness)
    setPixel(buffer, cols, i, rows - 1, brightness)
    setPixel(buffer, cols, cols - 1 - i, rows - 1, brightness)
  }
}
