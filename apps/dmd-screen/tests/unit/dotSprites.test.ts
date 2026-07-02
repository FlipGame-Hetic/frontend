import { describe, expect, it, vi } from "vitest"
import { createDotSpriteCache } from "@/dmd/dotSprites"

interface FakeCanvas {
  width: number
  height: number
  getContext: ReturnType<typeof vi.fn>
}

function makeBakingCtx() {
  return {
    setTransform: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    shadowBlur: 0,
    shadowColor: "",
    shadowOffsetX: 0,
    fillStyle: "",
  }
}

function makeCanvasFactory(getContext: () => unknown) {
  const created: FakeCanvas[] = []
  const createCanvas = () => {
    const canvas: FakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => getContext()),
    }
    created.push(canvas)
    return canvas as unknown as HTMLCanvasElement
  }
  return { createCanvas, created }
}

describe("createDotSpriteCache", () => {
  it("keys sprites by packed cell and treats -1 (default) as its own entry", () => {
    const { createCanvas, created } = makeCanvasFactory(() => makeBakingCtx())
    const cache = createDotSpriteCache(createCanvas)
    cache.configure(4, 1)

    const def = cache.getGlowSprite(-1, 255, 140, 0)
    const cyan = cache.getGlowSprite(0x100f0ff, 0, 240, 255)

    expect(def).not.toBeNull()
    expect(cyan).not.toBeNull()
    expect(def).not.toBe(cyan)
    expect(created).toHaveLength(2)
    // same key returns the memoized canvas without re-baking
    expect(cache.getGlowSprite(-1, 255, 140, 0)).toBe(def)
    expect(created).toHaveLength(2)
  })

  it("bakes each color exactly once", () => {
    const { createCanvas, created } = makeCanvasFactory(() => makeBakingCtx())
    const cache = createDotSpriteCache(createCanvas)
    cache.configure(4, 1)

    const first = cache.getGlowSprite(-1, 255, 140, 0)
    const second = cache.getGlowSprite(-1, 255, 140, 0)

    expect(second).toBe(first)
    expect(created).toHaveLength(1)
  })

  it("clears the cache when radius or dpr changes, not otherwise", () => {
    const { createCanvas, created } = makeCanvasFactory(() => makeBakingCtx())
    const cache = createDotSpriteCache(createCanvas)

    cache.configure(4, 1)
    const a = cache.getGlowSprite(-1, 1, 2, 3)
    // same radius/dpr → no clear, memoized
    cache.configure(4, 1)
    expect(cache.getGlowSprite(-1, 1, 2, 3)).toBe(a)
    expect(created).toHaveLength(1)

    // radius change → clear + re-bake
    cache.configure(5, 1)
    const b = cache.getGlowSprite(-1, 1, 2, 3)
    expect(b).not.toBe(a)
    expect(created).toHaveLength(2)

    // dpr change → clear + re-bake
    cache.configure(5, 2)
    const c = cache.getGlowSprite(-1, 1, 2, 3)
    expect(c).not.toBe(b)
    expect(created).toHaveLength(3)
  })

  it("returns null once MAX_SPRITES distinct colors are baked", () => {
    const { createCanvas } = makeCanvasFactory(() => makeBakingCtx())
    const cache = createDotSpriteCache(createCanvas)
    cache.configure(4, 1)

    for (let i = 0; i < 64; i++) {
      expect(cache.getGlowSprite(i, 0, 0, 0)).not.toBeNull()
    }
    expect(cache.getGlowSprite(64, 0, 0, 0)).toBeNull()
  })

  it("returns null when the 2d context is unavailable (jsdom)", () => {
    const { createCanvas, created } = makeCanvasFactory(() => null)
    const cache = createDotSpriteCache(createCanvas)
    cache.configure(4, 1)

    expect(cache.getGlowSprite(-1, 1, 2, 3)).toBeNull()
    // not memoized, so a later call tries again
    expect(cache.getGlowSprite(-1, 1, 2, 3)).toBeNull()
    expect(created).toHaveLength(2)
  })
})
