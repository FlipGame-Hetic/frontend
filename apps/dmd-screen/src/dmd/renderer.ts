import type { DmdConfig } from "./config"
import type { DotSurface } from "./types"
import { GLOW_ALPHA, GLOW_BLUR_FACTOR, type DotSpriteCache } from "./dotSprites"
import { hexToRgb, isColorSet, unpackRgb } from "./palette"

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
 * and per-dot color from the surface. Cells with no explicit color fall back to
 * config.dotColor. The glow color is only updated when the dot color changes, so
 * a one-color run costs a single shadow update.
 */
export function drawActiveDotsToCanvas(
  ctx: CanvasRenderingContext2D,
  surface: DotSurface,
  config: DmdConfig,
  width: number,
  height: number,
  dpr = 1,
  sprites?: DotSpriteCache,
): void {
  const { buffer, color, cols, rows } = surface
  const { dotColor, gapRatio } = config

  const cellW = width / cols
  const cellH = height / rows
  const cellSize = Math.min(cellW, cellH)
  const radius = (cellSize * (1 - gapRatio)) / 2

  const [defR, defG, defB] = hexToRgb(dotColor)

  if (sprites) sprites.configure(radius, dpr)

  let lastColorKey = NaN
  // True while the live shadow-blur glow (fallback path) is armed on the context.
  // Tracking it lets each path tear down the other's state exactly once at the
  // boundary, so a sprite disc never inherits a stale shadow and a fallback dot
  // never inherits a leftover globalAlpha.
  let shadowArmed = false

  for (let row = 0; row < rows; row++) {
    const cy = row * cellH + cellH / 2
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col
      const brightness = buffer[idx] ?? 0
      if (brightness <= 0) continue

      const cell = color[idx] ?? 0
      const set = isColorSet(cell)
      const [r, g, b] = set ? unpackRgb(cell) : [defR, defG, defB]
      const rgbStr = String(r) + "," + String(g) + "," + String(b)

      const colorKey = set ? cell : -1
      const cx = col * cellW + cellW / 2

      const glow = sprites ? sprites.getGlowSprite(colorKey, r, g, b) : null
      if (glow) {
        // Glow-only sprite scaled by brightness (blur is linear) + analytic opaque
        // disc, both under globalAlpha=brightness — pixel-identical to the shadow path.
        if (shadowArmed) {
          ctx.shadowColor = "transparent"
          ctx.shadowBlur = 0
          shadowArmed = false
          lastColorKey = NaN
        }
        const cssW = glow.width / dpr
        ctx.globalAlpha = brightness
        ctx.drawImage(glow, cx - cssW / 2, cy - cssW / 2, cssW, cssW)
        if (colorKey !== lastColorKey) {
          ctx.fillStyle = "rgb(" + rgbStr + ")"
          lastColorKey = colorKey
        }
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fill()
        continue
      }

      // Fallback: live shadow-blur glow drawn opaque, brightness baked into the
      // fill alpha — so globalAlpha must be 1, not a value left by a sprite dot.
      ctx.globalAlpha = 1
      if (!shadowArmed) {
        ctx.shadowBlur = radius * GLOW_BLUR_FACTOR
        shadowArmed = true
        lastColorKey = NaN
      }
      if (colorKey !== lastColorKey) {
        ctx.shadowColor = "rgba(" + rgbStr + "," + String(GLOW_ALPHA) + ")"
        lastColorKey = colorKey
      }

      ctx.fillStyle = "rgba(" + rgbStr + "," + String(brightness) + ")"
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.globalAlpha = 1
  // Reset shadow
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
}
