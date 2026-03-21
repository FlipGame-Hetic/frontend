import type { DotBuffer } from "./types"
import { setPixel } from "./buffer"

const BIG_WIDTH = 10
const BIG_HEIGHT = 14

/**
 * 10×14 large digit font — 2× pixel-doubled from 5×7 base.
 * Each digit is 14 rows of 10-bit values.
 * Bit 9 (0b1000000000) = leftmost pixel, bit 0 = rightmost.
 */
const FONT_BIG: Record<string, number[]> = {
  "0": scale2x([0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110]),
  "1": scale2x([0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110]),
  "2": scale2x([0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111]),
  "3": scale2x([0b01110, 0b10001, 0b00001, 0b00110, 0b00001, 0b10001, 0b01110]),
  "4": scale2x([0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010]),
  "5": scale2x([0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110]),
  "6": scale2x([0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110]),
  "7": scale2x([0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000]),
  "8": scale2x([0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110]),
  "9": scale2x([0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100]),
  " ": scale2x([0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000]),
}

/** Scale a 5×7 glyph to 10×14 by doubling each pixel */
function scale2x(rows5x7: number[]): number[] {
  const result: number[] = []
  for (const row of rows5x7) {
    let wide = 0
    for (let bit = 4; bit >= 0; bit--) {
      if (row & (1 << bit)) {
        wide |= 0b11 << (bit * 2)
      }
    }
    result.push(wide, wide) // duplicate row
  }
  return result
}

export function drawBigChar(
  buffer: DotBuffer,
  cols: number,
  char: string,
  x: number,
  y: number,
  brightness = 1.0,
): void {
  const data = FONT_BIG[char]
  if (!data) return

  for (let row = 0; row < BIG_HEIGHT; row++) {
    const bits = data[row] ?? 0
    for (let col = 0; col < BIG_WIDTH; col++) {
      if (bits & (1 << (BIG_WIDTH - 1 - col))) {
        setPixel(buffer, cols, x + col, y + row, brightness)
      }
    }
  }
}

export function drawBigString(
  buffer: DotBuffer,
  cols: number,
  text: string,
  x: number,
  y: number,
  spacing = 2,
  brightness = 1.0,
): void {
  let cursorX = x
  for (const char of text) {
    drawBigChar(buffer, cols, char, cursorX, y, brightness)
    cursorX += BIG_WIDTH + spacing
  }
}

export function measureBigString(text: string, spacing = 2): number {
  if (text.length === 0) return 0
  return text.length * BIG_WIDTH + (text.length - 1) * spacing
}
