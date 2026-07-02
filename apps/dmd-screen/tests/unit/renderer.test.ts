import { describe, expect, it, vi } from "vitest"
import type { DmdConfig } from "@/dmd/config"
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
