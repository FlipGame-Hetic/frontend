import type { DotSurface } from "./types"
import type { ColorInput } from "./palette"
import { setPixel } from "./buffer"

/**
 * Bold digit font for the hero score. Glyphs are 5x7 base shapes drawn scaled and
 * thickened with a 1px horizontal smear so they read as heavy/bold on the DMD.
 * Only 0-9 and '.' (the French thousands separator) are supported.
 */
const GLYPH_W = 5
const GLYPH_H = 7

const SCORE_GLYPHS: Record<string, number[]> = {
  "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  "2": [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  "3": [0b01110, 0b10001, 0b00001, 0b00110, 0b00001, 0b10001, 0b01110],
  "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  "5": [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  "6": [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  "8": [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  "9": [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  ".": [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b01100, 0b01100],
}

/** Height in pixels of a score glyph at the given scale. */
export const SCORE_GLYPH_HEIGHT = GLYPH_H

export function measureScore(text: string, scale: number, spacing: number): number {
  if (text.length === 0) return 0
  return text.length * GLYPH_W * scale + (text.length - 1) * spacing
}

function drawGlyph(
  s: DotSurface,
  glyph: number[],
  x: number,
  y: number,
  scale: number,
  brightness: number,
  color?: ColorInput,
): void {
  for (let row = 0; row < GLYPH_H; row++) {
    const bits = glyph[row] ?? 0
    for (let col = 0; col < GLYPH_W; col++) {
      if (bits & (1 << (GLYPH_W - 1 - col))) {
        const px = x + col * scale
        const py = y + row * scale
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            setPixel(s, px + dx, py + dy, brightness, color)
          }
          // Bold smear: one extra pixel to the right of each lit block.
          setPixel(s, px + scale, py + dy, brightness, color)
        }
      }
    }
  }
}

export function drawScore(
  s: DotSurface,
  text: string,
  x: number,
  y: number,
  scale: number,
  brightness: number,
  spacing: number,
  color?: ColorInput,
): void {
  let cursorX = x
  for (const char of text) {
    const glyph = SCORE_GLYPHS[char]
    if (glyph) drawGlyph(s, glyph, cursorX, y, scale, brightness, color)
    cursorX += GLYPH_W * scale + spacing
  }
}

export interface ScoreFit {
  scale: number
  spacing: number
  fits: boolean
}

/**
 * Chooses the largest { scale, spacing } whose rendered width fits `maxWidth`,
 * keeping the hero score as big as possible. `maxScale` caps the size (the
 * game-over score wants a step smaller than the in-game one). Returns
 * `fits: false` when even the smallest combination overflows, so the caller can
 * fall back to a thinner font.
 */
export function fitScore(text: string, maxWidth: number, maxScale = 3): ScoreFit {
  const scales = [3, 2, 1].filter((s) => s <= maxScale)
  const spacings = [2, 1]
  for (const scale of scales) {
    for (const spacing of spacings) {
      if (measureScore(text, scale, spacing) <= maxWidth) return { scale, spacing, fits: true }
    }
  }
  return { scale: 1, spacing: 1, fits: false }
}
