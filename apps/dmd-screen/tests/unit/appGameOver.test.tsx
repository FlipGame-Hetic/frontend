import { cleanup, render, act } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ScreenEnvelope } from "@frontend/types"
import { useDebugOverlayStore } from "@frontend/ui"
import App from "@/App"

const { dmdCanvasMock, levaMock, useScreenHubMock } = vi.hoisted(() => ({
  dmdCanvasMock: vi.fn(),
  levaMock: vi.fn(),
  useScreenHubMock: vi.fn(),
}))

vi.mock("@frontend/ws", () => ({
  useScreenHub: useScreenHubMock,
  registerScreenSender: vi.fn(),
  sendEventTo: vi.fn(),
}))

vi.mock("@/dmd/DmdCanvas", () => ({
  DmdCanvas: (props: unknown) => {
    dmdCanvasMock(props)
    return null
  },
}))

vi.mock("leva", () => ({
  Leva: (props: unknown) => {
    levaMock(props)
    return null
  },
  useControls: () => ({
    scene: null,
    cols: 128,
    dotColor: "#FF8C00",
    gapRatio: 0.2,
    offOpacity: 0.05,
  }),
}))

vi.mock("@/dmd/useDmdDevControls", () => ({
  useDmdDevControls: () => ({
    config: {
      cols: 128,
      rows: 72,
      dotColor: "#FF8C00",
      bgColor: "#000000",
      offOpacity: 0.05,
      gapRatio: 0.2,
    },
    devPhase: null,
  }),
}))

const lastScreenHubOptions = (): { onEvent?: (envelope: ScreenEnvelope) => void } => {
  return useScreenHubMock.mock.calls.at(-1)?.[0] as {
    onEvent?: (envelope: ScreenEnvelope) => void
  }
}

const lastCanvasSceneName = (): string | undefined => {
  const props = dmdCanvasMock.mock.calls.at(-1)?.[0] as
    | { scene?: { constructor?: { name?: string } } }
    | undefined
  return props?.scene?.constructor?.name
}

const lastLevaProps = (): { hidden?: boolean } | undefined =>
  levaMock.mock.calls.at(-1)?.[0] as { hidden?: boolean } | undefined

describe("dmd-screen App game over events", () => {
  beforeEach(() => {
    cleanup()
    dmdCanvasMock.mockClear()
    levaMock.mockClear()
    useScreenHubMock.mockClear()
    useDebugOverlayStore.setState({ visible: false })
    useScreenHubMock.mockReturnValue({
      status: "connected",
      send: vi.fn(),
    })
  })

  it("selects the game over scene when GameOver is received", () => {
    render(<App />)

    const options = lastScreenHubOptions()

    act(() => {
      options.onEvent?.({
        from: "game_engine",
        to: { kind: "broadcast" },
        event_type: "GameOver",
        payload: { final_score: 9876 },
      })
    })

    expect(lastCanvasSceneName()).toBe("GameOverScene")
  })

  it("keeps Leva hidden until the debug overlay is toggled", () => {
    render(<App />)

    expect(lastLevaProps()?.hidden).toBe(true)

    act(() => {
      useDebugOverlayStore.getState().toggle()
    })

    expect(lastLevaProps()?.hidden).toBe(false)
  })
})
