import type { ColorBuffer, DotBuffer, DotSurface } from "./types"
import type { ColorInput } from "./palette"
import { resolveColor } from "./palette"

function createBuffer(cols: number, rows: number): DotBuffer {
  return new Float32Array(cols * rows)
}

function createColorBuffer(cols: number, rows: number): ColorBuffer {
  return new Uint32Array(cols * rows)
}

/** Allocates a full drawing surface (brightness + color buffers + dimensions). */
export function createSurface(cols: number, rows: number): DotSurface {
  return {
    buffer: createBuffer(cols, rows),
    color: createColorBuffer(cols, rows),
    cols,
    rows,
  }
}

export function clearBuffer(buffer: DotBuffer): void {
  buffer.fill(0)
}

export function clearColor(color: ColorBuffer): void {
  color.fill(0)
}

/**
 * Lights a dot at (x, y). Writes brightness always; writes the color cell to the
 * resolved color when `color` is given, else 0 (default). Last write wins.
 */
export function setPixel(
  s: DotSurface,
  x: number,
  y: number,
  brightness: number,
  color?: ColorInput,
): void {
  if (x < 0 || y < 0 || x >= s.cols || y >= s.rows) return
  const i = y * s.cols + x
  s.buffer[i] = brightness
  s.color[i] = color === undefined ? 0 : resolveColor(color)
}
