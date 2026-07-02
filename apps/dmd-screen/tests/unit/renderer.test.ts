import { describe, expect, it, vi } from "vitest"
import type { DmdConfig } from "@/dmd/config"
import type { DotSpriteCache } from "@/dmd/dotSprites"
import { createSurface, setPixel } from "@/dmd/buffer"
import { drawActiveDotsToCanvas, drawDotGridToCanvas } from "@/dmd/renderer"

const config: DmdConfig = {
  cols: 2,
  rows: 1,
  dotColor: "#123456",
  bgColor: "#000000",
  offOpacity: 0.05,
  gapRatio: 0.2,
}

interface FillCall {
  fillStyle: string
  shadowColor: string
  shadowBlur: number
}

interface FakeCanvasContext {
  fillStyle: string
  shadowColor: string
  shadowBlur: number
  fills: FillCall[]
  arcs: [number, number, number, number, number][]
  fillRects: [number, number, number, number][]
  beginPath: ReturnType<typeof vi.fn>
  arc: ReturnType<typeof vi.fn>
  fill: ReturnType<typeof vi.fn>
  fillRect: ReturnType<typeof vi.fn>
}

function makeCtx(): CanvasRenderingContext2D & FakeCanvasContext {
  const ctx: FakeCanvasContext = {
    fillStyle: "",
    shadowColor: "",
    shadowBlur: 0,
    fills: [],
    arcs: [],
    fillRects: [],
    beginPath: vi.fn(),
    arc: vi.fn((x: number, y: number, r: number, start: number, end: number) => {
      ctx.arcs.push([x, y, r, start, end])
    }),
    fill: vi.fn(() => {
      ctx.fills.push({
        fillStyle: ctx.fillStyle,
        shadowColor: ctx.shadowColor,
        shadowBlur: ctx.shadowBlur,
      })
    }),
    fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
      ctx.fillRects.push([x, y, w, h])
    }),
  }
  return ctx as CanvasRenderingContext2D & FakeCanvasContext
}

describe("drawActiveDotsToCanvas", () => {
  it("uses config.dotColor when a lit dot has no explicit color", () => {
    const surface = createSurface(2, 1)
    setPixel(surface, 0, 0, 0.5)
    const ctx = makeCtx()

    drawActiveDotsToCanvas(ctx, surface, config, 20, 10)

    expect(ctx.fills).toHaveLength(1)
    const fill = ctx.fills[0]
    if (!fill) throw new Error("active dot was not filled")
    expect(fill.fillStyle).toBe("rgba(18,52,86,0.5)")
    expect(fill.shadowColor).toBe("rgba(18,52,86,0.6)")
  })

  it("uses per-dot color cells and keeps explicit black distinct from default", () => {
    const surface = createSurface(2, 1)
    setPixel(surface, 0, 0, 1.0, "cyan")
    setPixel(surface, 1, 0, 0.75, [0, 0, 0])
    const ctx = makeCtx()

    drawActiveDotsToCanvas(ctx, surface, config, 20, 10)

    expect(ctx.fills.map((call) => call.fillStyle)).toEqual([
      "rgba(0,240,255,1)",
      "rgba(0,0,0,0.75)",
    ])
    expect(ctx.fills.map((call) => call.shadowColor)).toEqual([
      "rgba(0,240,255,0.6)",
      "rgba(0,0,0,0.6)",
    ])
  })

  it("skips dark cells and resets the canvas shadow after drawing", () => {
    const surface = createSurface(2, 1)
    setPixel(surface, 0, 0, 0)
    setPixel(surface, 1, 0, 0.25, "pink")
    const ctx = makeCtx()

    drawActiveDotsToCanvas(ctx, surface, config, 20, 10)

    expect(ctx.fills).toHaveLength(1)
    const fill = ctx.fills[0]
    if (!fill) throw new Error("active dot was not filled")
    expect(fill.fillStyle).toBe("rgba(255,45,107,0.25)")
    expect(ctx.shadowColor).toBe("transparent")
    expect(ctx.shadowBlur).toBe(0)
  })
})

interface DrawOp {
  type: "drawImage" | "fill"
  globalAlpha: number
  fillStyle: string
  shadowColor: string
}

interface RecordingCtx {
  ctx: CanvasRenderingContext2D
  ops: DrawOp[]
  shadowColorWrites: string[]
  getGlobalAlpha(): number
}

function makeRecordingCtx(): RecordingCtx {
  const ops: DrawOp[] = []
  const shadowColorWrites: string[] = []
  let globalAlpha = 1
  let fillStyle = ""
  let shadowColor = ""
  let shadowBlur = 0
  const ctx = {
    get globalAlpha() {
      return globalAlpha
    },
    set globalAlpha(v: number) {
      globalAlpha = v
    },
    get fillStyle() {
      return fillStyle
    },
    set fillStyle(v: string) {
      fillStyle = v
    },
    get shadowColor() {
      return shadowColor
    },
    set shadowColor(v: string) {
      shadowColor = v
      shadowColorWrites.push(v)
    },
    get shadowBlur() {
      return shadowBlur
    },
    set shadowBlur(v: number) {
      shadowBlur = v
    },
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(() => {
      ops.push({ type: "fill", globalAlpha, fillStyle, shadowColor })
    }),
    drawImage: vi.fn(() => {
      ops.push({ type: "drawImage", globalAlpha, fillStyle, shadowColor })
    }),
  }
  return {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    ops,
    shadowColorWrites,
    getGlobalAlpha: () => globalAlpha,
  }
}

function makeFakeSpriteCache(sprite: HTMLCanvasElement | null): DotSpriteCache {
  return {
    configure: vi.fn(),
    getGlowSprite: vi.fn(() => sprite),
  } as unknown as DotSpriteCache
}

describe("drawActiveDotsToCanvas — sprite path", () => {
  const dummySprite = { width: 8, height: 8 } as unknown as HTMLCanvasElement

  it("draws the glow before the disc and scales both by brightness", () => {
    const surface = createSurface(2, 1)
    setPixel(surface, 0, 0, 0.5)
    setPixel(surface, 1, 0, 1.0, "cyan")
    const rec = makeRecordingCtx()
    const sprites = makeFakeSpriteCache(dummySprite)

    drawActiveDotsToCanvas(rec.ctx, surface, config, 20, 10, 2, sprites)

    expect(rec.ops.map((op) => op.type)).toEqual(["drawImage", "fill", "drawImage", "fill"])
    // glow drawImage precedes the disc fill per dot, both at that dot's brightness
    expect(rec.ops.map((op) => op.globalAlpha)).toEqual([0.5, 0.5, 1.0, 1.0])
    expect(rec.getGlobalAlpha()).toBe(1)
  })

  it("never writes a glow shadow color on the sprite path", () => {
    const surface = createSurface(2, 1)
    setPixel(surface, 0, 0, 0.5)
    setPixel(surface, 1, 0, 1.0, "cyan")
    const rec = makeRecordingCtx()
    const sprites = makeFakeSpriteCache(dummySprite)

    drawActiveDotsToCanvas(rec.ctx, surface, config, 20, 10, 2, sprites)

    // only the post-loop reset writes shadowColor; no per-dot glow shadow
    expect(rec.shadowColorWrites).toEqual(["transparent"])
    for (const op of rec.ops) expect(op.shadowColor).toBe("")
  })

  it("falls back to the shadow path when the cache returns null", () => {
    const surface = createSurface(2, 1)
    setPixel(surface, 0, 0, 0.5)
    const rec = makeRecordingCtx()
    const sprites = makeFakeSpriteCache(null)

    drawActiveDotsToCanvas(rec.ctx, surface, config, 20, 10, 2, sprites)

    expect(rec.ops.map((op) => op.type)).toEqual(["fill"])
    const fill = rec.ops[0]
    if (!fill) throw new Error("active dot was not filled")
    expect(fill.fillStyle).toBe("rgba(18,52,86,0.5)")
    expect(fill.shadowColor).toBe("rgba(18,52,86,0.6)")
  })
})

// A frame that mixes both paths only happens once the sprite cache is full
// (>MAX_SPRITES colors), but when it does the two paths must not leak canvas
// state into each other.
describe("drawActiveDotsToCanvas — mixed sprite/fallback frame", () => {
  const dummySprite = { width: 8, height: 8 } as unknown as HTMLCanvasElement

  function makeSelectiveSpriteCache(
    spriteFor: (colorKey: number) => HTMLCanvasElement | null,
  ): DotSpriteCache {
    return {
      configure: vi.fn(),
      getGlowSprite: vi.fn((colorKey: number) => spriteFor(colorKey)),
    } as unknown as DotSpriteCache
  }

  it("does not leak globalAlpha from a sprite dot onto a following fallback dot", () => {
    const surface = createSurface(2, 1)
    setPixel(surface, 0, 0, 0.5) // default color -> sprite
    setPixel(surface, 1, 0, 0.25, "cyan") // cyan -> no sprite -> fallback
    const rec = makeRecordingCtx()
    const sprites = makeSelectiveSpriteCache((key) => (key === -1 ? dummySprite : null))

    drawActiveDotsToCanvas(rec.ctx, surface, config, 20, 10, 2, sprites)

    expect(rec.ops.map((op) => op.type)).toEqual(["drawImage", "fill", "fill"])
    const fallbackFill = rec.ops[2]
    if (!fallbackFill) throw new Error("fallback dot was not filled")
    // brightness belongs in the rgba alpha, not a leftover globalAlpha
    expect(fallbackFill.globalAlpha).toBe(1)
    expect(fallbackFill.fillStyle).toBe("rgba(0,240,255,0.25)")
  })

  it("does not leave a stale glow shadow on a sprite disc after a fallback dot", () => {
    const surface = createSurface(2, 1)
    setPixel(surface, 0, 0, 0.8, "cyan") // cyan -> fallback, arms the shadow
    setPixel(surface, 1, 0, 0.5) // default -> sprite; its disc must not glow
    const rec = makeRecordingCtx()
    const sprites = makeSelectiveSpriteCache((key) => (key === -1 ? dummySprite : null))

    drawActiveDotsToCanvas(rec.ctx, surface, config, 20, 10, 2, sprites)

    expect(rec.ops.map((op) => op.type)).toEqual(["fill", "drawImage", "fill"])
    const discFill = rec.ops[2]
    if (!discFill) throw new Error("sprite disc was not filled")
    expect(discFill.shadowColor).toBe("transparent")
  })
})

describe("drawDotGridToCanvas", () => {
  it("paints the background and monochrome ghost grid", () => {
    const ctx = makeCtx()

    drawDotGridToCanvas(ctx, config, 20, 10)

    expect(ctx.fillRects).toEqual([[0, 0, 20, 10]])
    expect(ctx.arcs).toHaveLength(2)
    expect(ctx.fills.map((call) => call.fillStyle)).toEqual([
      "rgba(18,52,86,0.05)",
      "rgba(18,52,86,0.05)",
    ])
  })
})
