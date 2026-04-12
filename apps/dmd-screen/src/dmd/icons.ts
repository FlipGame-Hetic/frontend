import type { DotBuffer } from "./types"
import { setPixel } from "./buffer"

// 5×5 pixel heart icon. Bit 4 = leftmost pixel.
const HEART_BITMAP = [0b01010, 0b11111, 0b11111, 0b01110, 0b00100]

export function drawHeart(
  buffer: DotBuffer,
  cols: number,
  x: number,
  y: number,
  brightness: number,
): void {
  for (let row = 0; row < HEART_BITMAP.length; row++) {
    const bits = HEART_BITMAP[row] ?? 0
    for (let col = 0; col < 5; col++) {
      if (bits & (1 << (4 - col))) {
        setPixel(buffer, cols, x + col, y + row, brightness)
      }
    }
  }
}

// Draw maxCount hearts: first filledCount at `brightness`, rest at `dimBrightness`
export function drawHearts(
  buffer: DotBuffer,
  cols: number,
  x: number,
  y: number,
  filledCount: number,
  maxCount: number,
  brightness = 1.0,
  dimBrightness = 0.15,
): void {
  const heartSpacing = 7 // 5px wide + 2px gap
  for (let i = 0; i < maxCount; i++) {
    drawHeart(buffer, cols, x + i * heartSpacing, y, i < filledCount ? brightness : dimBrightness)
  }
}
