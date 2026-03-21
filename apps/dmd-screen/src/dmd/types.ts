/** 2D buffer of dot brightness values (0.0 = off, 1.0 = full on) */
export type DotBuffer = Float32Array

export interface RenderContext {
  buffer: DotBuffer
  cols: number
  rows: number
  deltaMs: number
  elapsedMs: number
}

export interface Scene {
  render(ctx: RenderContext): void
  enter?(): void
  exit?(): void
}
