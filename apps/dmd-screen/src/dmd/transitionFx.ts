import type { ColorBuffer, DotBuffer, DotSurface } from "./types"
import { resolveColor } from "./palette"

const FLASH_COLOR = resolveColor("#9ffcff")

/** Multiplies every brightness in the buffer in-place by `factor` (clamped 0..1). */
export function fadeBuffer(buffer: DotBuffer, factor: number): void {
  const f = factor < 0 ? 0 : factor > 1 ? 1 : factor
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = (buffer[i] ?? 0) * f
  }
}

/**
 * Cyberpunk row-based glitch dissolve. The surface already holds the NEW scene;
 * rows whose per-row `thresholds[y]` hasn't been passed by `progress` are replaced
 * by the OLD snapshot (with occasional horizontal tears), and random scanlines get
 * blacked out, flashed, or dimmed — glitch strongest at mid-transition. In-place.
 *
 * `rand` (0..1) is injectable so the effect is deterministic under test.
 */
export function glitchDissolve(
  surface: DotSurface,
  fromBuffer: DotBuffer,
  fromColor: ColorBuffer,
  progress: number,
  thresholds: Float32Array,
  rand: () => number,
): void {
  const { cols, rows, buffer, color } = surface
  const glitch = 1 - Math.abs(progress * 2 - 1) // 0 at the ends, 1 at the middle

  for (let y = 0; y < rows; y++) {
    const rowStart = y * cols
    const threshold = thresholds[y] ?? 1

    if (progress < threshold) {
      // Row still shows the old snapshot, with an occasional horizontal tear.
      const tear = rand() < 0.3 * glitch ? Math.round((rand() - 0.5) * 12) : 0
      for (let x = 0; x < cols; x++) {
        const i = rowStart + x
        const sx = x - tear
        if (sx >= 0 && sx < cols) {
          const si = rowStart + sx
          buffer[i] = fromBuffer[si] ?? 0
          color[i] = fromColor[si] ?? 0
        } else {
          buffer[i] = 0
          color[i] = 0
        }
      }
    }

    // Row-level glitch overlay on whatever content the row now holds.
    const roll = rand()
    if (roll < 0.06 * glitch) {
      for (let x = 0; x < cols; x++) buffer[rowStart + x] = 0 // blackout tear line
    } else if (roll < 0.1 * glitch) {
      for (let x = 0; x < cols; x++) {
        buffer[rowStart + x] = 0.85 // bright scan flash
        color[rowStart + x] = FLASH_COLOR
      }
    } else if (roll < 0.3 * glitch) {
      const f = 0.6 + 0.5 * rand()
      for (let x = 0; x < cols; x++) buffer[rowStart + x] = (buffer[rowStart + x] ?? 0) * f
    }
  }
}
