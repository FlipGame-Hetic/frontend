import type { DmdConfig } from "./config"
import type { DotBuffer } from "./types"

export function createBuffer(cols: number, rows: number): DotBuffer {
  return new Float32Array(cols * rows)
}

export function clearBuffer(buffer: DotBuffer): void {
  buffer.fill(0)
}

export function setPixel(
  buffer: DotBuffer,
  cols: number,
  x: number,
  y: number,
  brightness: number,
): void {
  if (x < 0 || y < 0 || x >= cols || y >= buffer.length / cols) return
  buffer[y * cols + x] = brightness
}

export function getPixel(buffer: DotBuffer, cols: number, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= cols || y >= buffer.length / cols) return 0
  return buffer[y * cols + x] ?? 0
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

export function drawDotsToCanvas(
  ctx: CanvasRenderingContext2D,
  buffer: DotBuffer,
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
