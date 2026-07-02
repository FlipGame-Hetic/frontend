/** 2D buffer of dot brightness values (0.0 = off, 1.0 = full on) */
export type DotBuffer = Float32Array

/** 2D buffer of packed per-dot colors (0xRRGGBB | SET_FLAG); 0 = unset/default. */
export type ColorBuffer = Uint32Array

/** A drawing surface: brightness + color buffers plus grid dimensions. */
export interface DotSurface {
  buffer: DotBuffer
  color: ColorBuffer
  cols: number
  rows: number
}

export interface RenderContext extends DotSurface {
  deltaMs: number
  elapsedMs: number
}

export interface Scene {
  render(ctx: RenderContext): void
  enter?(): void
  exit?(): void
}
