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
