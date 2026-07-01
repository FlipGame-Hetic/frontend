import type { DotBuffer } from "./types"

/** Multiplies every brightness in the buffer in-place by `factor` (clamped 0..1). */
export function fadeBuffer(buffer: DotBuffer, factor: number): void {
  const f = factor < 0 ? 0 : factor > 1 ? 1 : factor
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = (buffer[i] ?? 0) * f
  }
}
