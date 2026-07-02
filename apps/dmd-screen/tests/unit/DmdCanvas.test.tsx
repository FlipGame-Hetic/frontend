import { act, cleanup, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { DmdConfig } from "@/dmd/config"
import type { RenderContext, Scene } from "@/dmd/types"
import { setPixel } from "@/dmd/buffer"
import { isColorSet, unpackRgb } from "@/dmd/palette"
import { DmdCanvas } from "@/dmd/DmdCanvas"

const { drawActiveDotsToCanvasMock, drawDotGridToCanvasMock, useAnimationFrameMock } = vi.hoisted(
  () => ({
    drawActiveDotsToCanvasMock: vi.fn(),
    drawDotGridToCanvasMock: vi.fn(),
    useAnimationFrameMock: vi.fn(),
  }),
)

vi.mock("@/dmd/renderer", () => ({
  drawActiveDotsToCanvas: drawActiveDotsToCanvasMock,
  drawDotGridToCanvas: drawDotGridToCanvasMock,
}))

vi.mock("@/dmd/useAnimationFrame", () => ({
  useAnimationFrame: useAnimationFrameMock,
}))

const config: DmdConfig = {
  cols: 8,
  rows: 4,
  dotColor: "#FF8C00",
  bgColor: "#000000",
  offOpacity: 0.05,
  gapRatio: 0.2,
}

interface FakeCanvasContext {
  setTransform: ReturnType<typeof vi.fn>
  drawImage: ReturnType<typeof vi.fn>
}

function makeCtx(): CanvasRenderingContext2D & FakeCanvasContext {
  return {
    setTransform: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D & FakeCanvasContext
}

function latestAnimationCallback(): (deltaMs: number, elapsedMs: number) => void {
  const callback = useAnimationFrameMock.mock.calls.at(-1)?.[0] as
    | ((deltaMs: number, elapsedMs: number) => void)
    | undefined
  if (!callback) throw new Error("DmdCanvas did not register an animation callback")
  return callback
}

describe("DmdCanvas", () => {
  let contexts: (CanvasRenderingContext2D & FakeCanvasContext)[]

  beforeEach(() => {
    contexts = []
    drawActiveDotsToCanvasMock.mockClear()
    drawDotGridToCanvasMock.mockClear()
    useAnimationFrameMock.mockClear()

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
      const ctx = makeCtx()
      contexts.push(ctx)
      return ctx
    })

    class ResizeObserverMock {
      constructor(private readonly callback: ResizeObserverCallback) {}

      observe(): void {
        this.callback(
          [
            {
              contentRect: { width: 200, height: 100 },
            } as ResizeObserverEntry,
          ],
          this as unknown as ResizeObserver,
        )
      }

      disconnect = vi.fn()
      unobserve = vi.fn()
    }

    vi.stubGlobal("ResizeObserver", ResizeObserverMock)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("clears and passes a color-aware surface through the render loop", () => {
    const renderScene = vi.fn((ctx: RenderContext) => {
      setPixel(ctx, 1, 0, 0.7, "red")
    })
    const scene: Scene = { render: renderScene }
    render(<DmdCanvas config={config} scene={scene} />)

    act(() => {
      latestAnimationCallback()(16, 16)
    })

    expect(renderScene).toHaveBeenCalledWith(
      expect.objectContaining({ cols: 8, rows: 4, deltaMs: 16, elapsedMs: 16 }),
    )
    const activeDrawCall = drawActiveDotsToCanvasMock.mock.calls[0]
    if (!activeDrawCall) throw new Error("active dots were not drawn")
    const surface = activeDrawCall[1] as RenderContext
    expect(surface.buffer[1]).toBeCloseTo(0.7)
    const colorCell = surface.color[1] ?? 0
    expect(isColorSet(colorCell)).toBe(true)
    expect(unpackRgb(colorCell)).toEqual([0xff, 0x31, 0x31])
  })

  it("caches the ghost grid canvas while the config and size stay stable", () => {
    const scene: Scene = { render: vi.fn() }
    render(<DmdCanvas config={config} scene={scene} />)

    act(() => {
      latestAnimationCallback()(16, 16)
      latestAnimationCallback()(16, 32)
    })

    expect(drawDotGridToCanvasMock).toHaveBeenCalledTimes(1)
    expect(drawActiveDotsToCanvasMock).toHaveBeenCalledTimes(2)
    const onscreenContext = contexts[0]
    if (!onscreenContext) throw new Error("canvas context was not created")
    expect(onscreenContext.drawImage).toHaveBeenCalledTimes(2)
  })
})
