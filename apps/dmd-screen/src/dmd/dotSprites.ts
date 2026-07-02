/**
 * Per-color glow sprite cache for the DMD. Baking the blurred halo once per
 * color and scaling it with globalAlpha replaces one Skia shadow-blur pass per
 * lit dot per frame with a single drawImage. Only the GLOW is baked; the lit
 * disc stays analytic (see renderer.ts) because brightness is continuous.
 */

/** Cap the number of baked sprites so a rogue rainbow scene cannot leak canvases. */
const MAX_SPRITES = 64

/**
 * Glow appearance, shared with the analytic fallback in renderer.ts so a baked
 * sprite and a live shadow-blur render identically. Change them here only.
 */
export const GLOW_BLUR_FACTOR = 1.5 // blur radius as a multiple of the dot radius
export const GLOW_ALPHA = 0.6 // alpha of the glow halo

export interface DotSpriteCache {
  getGlowSprite(colorKey: number, r: number, g: number, b: number): HTMLCanvasElement | null
  configure(radiusCss: number, dpr: number): void
}

export function createDotSpriteCache(
  createCanvas: () => HTMLCanvasElement = () => document.createElement("canvas"),
): DotSpriteCache {
  const cache = new Map<number, HTMLCanvasElement>()
  let radiusCss = 0
  let dpr = 1
  let blur = 0
  let side = 0
  let paddingCss = 0

  function configure(nextRadius: number, nextDpr: number): void {
    if (nextRadius === radiusCss && nextDpr === dpr) return
    radiusCss = nextRadius
    dpr = nextDpr
    blur = radiusCss * GLOW_BLUR_FACTOR
    // square side big enough to hold the disc plus its full blur skirt
    side = 2 * Math.ceil(radiusCss + 2 * blur)
    paddingCss = side / 2
    cache.clear()
  }

  function getGlowSprite(
    colorKey: number,
    r: number,
    g: number,
    b: number,
  ): HTMLCanvasElement | null {
    const existing = cache.get(colorKey)
    if (existing) return existing
    if (cache.size >= MAX_SPRITES) return null

    const canvas = createCanvas()
    canvas.width = Math.max(1, Math.round(side * dpr))
    canvas.height = Math.max(1, Math.round(side * dpr))

    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    // shadowBlur is CTM-independent, so device-space blur matches the main canvas
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const rgb = String(r) + "," + String(g) + "," + String(b)

    // Draw the disc one full sprite-width off-canvas and pull only its shadow back
    // with shadowOffsetX (device px, unaffected by the CTM) so the sprite holds the
    // pure glow. Blur is linear (blur(mask*b) = b*blur(mask)), so brightness can
    // scale this baked halo later via globalAlpha.
    const offsetDevice = side * dpr
    ctx.shadowBlur = blur
    ctx.shadowColor = "rgba(" + rgb + "," + String(GLOW_ALPHA) + ")"
    ctx.shadowOffsetX = offsetDevice
    ctx.fillStyle = "rgb(" + rgb + ")"
    ctx.beginPath()
    ctx.arc(paddingCss - offsetDevice / dpr, paddingCss, radiusCss, 0, Math.PI * 2)
    ctx.fill()

    cache.set(colorKey, canvas)
    return canvas
  }

  return {
    getGlowSprite,
    configure,
  }
}
