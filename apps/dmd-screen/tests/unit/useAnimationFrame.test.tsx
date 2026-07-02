import { act, cleanup, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useAnimationFrame } from "@/dmd/useAnimationFrame"

let rafCallback: FrameRequestCallback | undefined
const requestAnimationFrameMock = vi.fn((callback: FrameRequestCallback) => {
  rafCallback = callback
  return 123
})
const cancelAnimationFrameMock = vi.fn()

function Probe({
  callback,
  fps,
}: {
  callback: (deltaMs: number, elapsedMs: number) => void
  fps: number
}) {
  useAnimationFrame(callback, fps)
  return null
}

function step(time: number): void {
  if (!rafCallback) throw new Error("requestAnimationFrame was not scheduled")
  act(() => {
    rafCallback?.(time)
  })
}

describe("useAnimationFrame", () => {
  beforeEach(() => {
    rafCallback = undefined
    requestAnimationFrameMock.mockClear()
    cancelAnimationFrameMock.mockClear()
    vi.stubGlobal("requestAnimationFrame", requestAnimationFrameMock)
    vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrameMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it("throttles callback execution to the requested fps", () => {
    const callback = vi.fn()
    render(<Probe callback={callback} fps={10} />)

    step(1000)
    step(1050)
    step(1101)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(101, 101)
  })

  it("uses the latest callback and cancels the scheduled frame on unmount", () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender, unmount } = render(<Probe callback={first} fps={60} />)

    step(1000)
    rerender(<Probe callback={second} fps={60} />)
    step(1020)
    unmount()

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
    expect(cancelAnimationFrameMock).toHaveBeenCalledWith(123)
  })
})
