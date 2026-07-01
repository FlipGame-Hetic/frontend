import type { DotSurface } from "./types"
import type { ColorInput } from "./palette"
import { setPixel } from "./buffer"
import { HEART_SPACING } from "./constants"

// 5×5 pixel heart icon. Bit 4 = leftmost pixel.
const HEART_BITMAP = [0b01010, 0b11111, 0b11111, 0b01110, 0b00100]

export function drawHeart(
  s: DotSurface,
  x: number,
  y: number,
  brightness: number,
  color?: ColorInput,
  scale = 1,
): void {
  for (let row = 0; row < HEART_BITMAP.length; row++) {
    const bits = HEART_BITMAP[row] ?? 0
    for (let col = 0; col < 5; col++) {
      if (bits & (1 << (4 - col))) {
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            setPixel(s, x + col * scale + dx, y + row * scale + dy, brightness, color)
          }
        }
      }
    }
  }
}

// Draw maxCount hearts: first filledCount at `brightness`, rest at `dimBrightness`
export function drawHearts(
  s: DotSurface,
  x: number,
  y: number,
  filledCount: number,
  maxCount: number,
  brightness = 1.0,
  dimBrightness = 0.15,
  color?: ColorInput,
  scale = 1,
): void {
  for (let i = 0; i < maxCount; i++) {
    drawHeart(
      s,
      x + i * HEART_SPACING * scale,
      y,
      i < filledCount ? brightness : dimBrightness,
      color,
      scale,
    )
  }
}
