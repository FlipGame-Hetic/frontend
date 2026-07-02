import type { DmdConfig } from "./config"
import type { DotBuffer } from "./types"

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

/**
 * Paints the dim "ghost grid" of unlit dots. Split out from the lit dots so
 * callers can cache it onto an offscreen canvas and only repaint the active
 * dots each frame. This and {@link drawActiveDotsToCanvas} are the only places
 * that know how a brightness buffer becomes pixels — scenes never touch the
 * canvas.
 */
export function drawDotGridToCanvas(
  ctx: CanvasRenderingContext2D,
  config: DmdConfig,
  width: number,
  height: number,
): void {
  const { cols, rows, dotColor, bgColor, offOpacity, gapRatio } = config

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)

  const cellW = width / cols
  const cellH = height / rows
  const cellSize = Math.min(cellW, cellH)
  const radius = (cellSize * (1 - gapRatio)) / 2

  const [r, g, b] = hexToRgb(dotColor)
  const rgbStr = String(r) + "," + String(g) + "," + String(b)

  // Draw off-dots (ghost grid)
  ctx.fillStyle = "rgba(" + rgbStr + "," + String(offOpacity) + ")"
  for (let row = 0; row < rows; row++) {
    const cy = row * cellH + cellH / 2
    for (let col = 0; col < cols; col++) {
      const cx = col * cellW + cellW / 2
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/**
 * Paints the lit dots with a glow on top of the ghost grid, reading brightness
 * from the buffer and skipping dark cells.
 */
export function drawActiveDotsToCanvas(
  ctx: CanvasRenderingContext2D,
  buffer: DotBuffer,
  config: DmdConfig,
  width: number,
  height: number,
): void {
  const { cols, rows, dotColor, gapRatio } = config

  const cellW = width / cols
  const cellH = height / rows
  const cellSize = Math.min(cellW, cellH)
  const radius = (cellSize * (1 - gapRatio)) / 2

  const [r, g, b] = hexToRgb(dotColor)
  const rgbStr = String(r) + "," + String(g) + "," + String(b)

  // Draw active dots with glow
  ctx.shadowColor = "rgba(" + rgbStr + ",0.6)"
  ctx.shadowBlur = radius * 1.5

  for (let row = 0; row < rows; row++) {
    const cy = row * cellH + cellH / 2
    for (let col = 0; col < cols; col++) {
      const brightness = buffer[row * cols + col] ?? 0
      if (brightness <= 0) continue

      const cx = col * cellW + cellW / 2
      ctx.fillStyle = "rgba(" + rgbStr + "," + String(brightness) + ")"
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Reset shadow
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
}
