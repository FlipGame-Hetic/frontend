import type { RenderContext, Scene } from "../types"
import { setPixel } from "../buffer"
import {
  HORIZON_Y,
  SUN_CENTER_X,
  SUN_CENTER_Y,
  SUN_RADIUS,
  GRID_VLINES,
  RUNG_COUNT,
  RUNG_SPEED,
  DASH_COUNT,
  DASH_SPEED,
  STAR_TWINKLE_MS,
} from "./preGameSceneConfig"

// Synthwave / outrun palette
const SUN_TOP = "#6ef5ff"
const SUN_MID = "#22c8ff"
const SUN_LOW = "#7a6cff"
const NEON_EDGE = "#3df0ff"
const WINDOW_COLOR = "#8fe8ff"
const HORIZON_COLOR = "#4dfcff"
const GRID_COLOR = "#ff2dd0"
const DASH_COLOR = "#ffe8ff"
const STAR_COLOR = "#bfefff"

const SKYLINE_W = 128

interface Building {
  x: number
  w: number
  h: number
}

// City skyline: filled silhouettes carved out of the sun, tallest toward the centre.
const BUILDINGS: Building[] = [
  { x: 0, w: 10, h: 8 },
  { x: 10, w: 8, h: 14 },
  { x: 19, w: 7, h: 10 },
  { x: 27, w: 9, h: 18 },
  { x: 37, w: 7, h: 12 },
  { x: 45, w: 8, h: 22 },
  { x: 54, w: 6, h: 16 },
  { x: 61, w: 7, h: 26 },
  { x: 69, w: 6, h: 15 },
  { x: 76, w: 8, h: 23 },
  { x: 85, w: 7, h: 12 },
  { x: 93, w: 9, h: 19 },
  { x: 103, w: 7, h: 11 },
  { x: 111, w: 9, h: 15 },
  { x: 121, w: 7, h: 9 },
]

interface Star {
  x: number
  y: number
}

const STARS: Star[] = [
  { x: 8, y: 6 },
  { x: 20, y: 13 },
  { x: 33, y: 4 },
  { x: 95, y: 8 },
  { x: 110, y: 15 },
  { x: 121, y: 5 },
]

// Per-column rooftop height, so the sun can be carved by the skyline silhouette.
function buildSkyline(): number[] {
  const top: number[] = new Array<number>(SKYLINE_W).fill(HORIZON_Y)
  for (const b of BUILDINGS) {
    const roof = HORIZON_Y - b.h
    const end = Math.min(b.x + b.w, SKYLINE_W)
    for (let x = b.x; x < end; x++) {
      if (roof < (top[x] ?? HORIZON_Y)) top[x] = roof
    }
  }
  return top
}
const SKYLINE = buildSkyline()

// Horizontal slits (off LEDs) across the lower half of the sun, thicker toward the base.
function sunGap(k: number): boolean {
  return k === 3 || k === 6 || k === 9 || k === 11 || k === 13 || k === 15
}

function sunColor(y: number): string {
  if (y < SUN_CENTER_Y - 8) return SUN_TOP
  if (y < SUN_CENTER_Y + 3) return SUN_MID
  return SUN_LOW
}

/**
 * The pre-game scene — shown during mode/character select, which the two select
 * phases both route to (players look at the backglass then). A filled synthwave
 * outrun: a big banded sun, a neon city skyline silhouetted against it, and a
 * full-width perspective grid floor whose rungs scroll toward the viewer.
 * Shapes are filled with colour and detailed with off LEDs (DMD-art style).
 */
export class PreGameScene implements Scene {
  private scroll = 0
  private dash = 0

  render(ctx: RenderContext): void {
    const { cols, rows, deltaMs, elapsedMs } = ctx
    this.scroll += deltaMs * RUNG_SPEED
    this.dash += deltaMs * DASH_SPEED

    this.renderStars(ctx, elapsedMs)
    this.renderSun(ctx)
    this.renderBuildings(ctx)
    this.renderHorizon(ctx, cols)
    this.renderGrid(ctx, cols, rows)
  }

  private renderStars(ctx: RenderContext, elapsedMs: number): void {
    let i = 0
    for (const s of STARS) {
      const twinkle = 0.3 + 0.6 * (0.5 + 0.5 * Math.sin(elapsedMs / STAR_TWINKLE_MS + i))
      setPixel(ctx, s.x, s.y, twinkle, STAR_COLOR)
      i++
    }
  }

  private renderSun(ctx: RenderContext): void {
    const r2 = SUN_RADIUS * SUN_RADIUS
    for (let y = SUN_CENTER_Y - SUN_RADIUS; y < HORIZON_Y; y++) {
      const dy = y - SUN_CENTER_Y
      if (y > SUN_CENTER_Y && sunGap(y - SUN_CENTER_Y)) continue // slit
      const color = sunColor(y)
      for (let x = SUN_CENTER_X - SUN_RADIUS; x <= SUN_CENTER_X + SUN_RADIUS; x++) {
        const dx = x - SUN_CENTER_X
        if (dx * dx + dy * dy > r2) continue
        if (x >= 0 && x < SKYLINE_W && y >= (SKYLINE[x] ?? HORIZON_Y)) continue // carved by skyline
        setPixel(ctx, x, y, 0.95, color)
      }
    }
  }

  private renderBuildings(ctx: RenderContext): void {
    for (const b of BUILDINGS) {
      const roof = HORIZON_Y - b.h
      const x2 = b.x + b.w - 1
      for (let x = b.x; x <= x2; x++) {
        setPixel(ctx, x, roof, 0.85, NEON_EDGE)
      }
      for (let y = roof; y < HORIZON_Y; y++) {
        setPixel(ctx, b.x, y, 0.7, NEON_EDGE)
        setPixel(ctx, x2, y, 0.7, NEON_EDGE)
      }
      for (let wy = roof + 2; wy < HORIZON_Y - 1; wy += 3) {
        for (let wx = b.x + 2; wx < x2; wx += 3) {
          setPixel(ctx, wx, wy, 0.3, WINDOW_COLOR)
        }
      }
    }
  }

  private renderHorizon(ctx: RenderContext, cols: number): void {
    for (let x = 0; x < cols; x++) {
      setPixel(ctx, x, HORIZON_Y, 0.9, HORIZON_COLOR)
    }
  }

  private renderGrid(ctx: RenderContext, cols: number, rows: number): void {
    const bottom = rows - 1
    const gh = bottom - HORIZON_Y

    // Converging vertical lines.
    for (let j = 0; j <= GRID_VLINES; j++) {
      const bx = (j * cols) / GRID_VLINES
      for (let y = HORIZON_Y + 1; y <= bottom; y++) {
        const t = (y - HORIZON_Y) / gh
        const x = Math.round(SUN_CENTER_X + (bx - SUN_CENTER_X) * t)
        setPixel(ctx, x, y, 0.25 + 0.5 * t, GRID_COLOR)
      }
    }

    // Full-width horizontal rungs scrolling toward the viewer.
    const phase = this.scroll % 1
    for (let i = 0; i < RUNG_COUNT; i++) {
      const z = (i / RUNG_COUNT + phase) % 1
      const y = Math.round(HORIZON_Y + z * z * gh)
      if (y <= HORIZON_Y || y > bottom) continue
      const b = 0.2 + 0.6 * z
      for (let x = 0; x < cols; x++) {
        setPixel(ctx, x, y, b, GRID_COLOR)
      }
    }

    // Bright center-line dashes.
    const dashPhase = this.dash % 1
    for (let i = 0; i < DASH_COUNT; i++) {
      const z = (i / DASH_COUNT + dashPhase) % 1
      const y = Math.round(HORIZON_Y + z * z * gh)
      if (y <= HORIZON_Y || y > bottom) continue
      setPixel(ctx, SUN_CENTER_X, y, 0.95, DASH_COLOR)
      setPixel(ctx, SUN_CENTER_X - 1, y, 0.8, DASH_COLOR)
    }
  }
}
