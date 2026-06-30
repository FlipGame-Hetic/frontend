import { cleanup, render, act } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ScreenEnvelope } from "@frontend/types"
import App from "@/App"

const { dmdCanvasMock, useScreenHubMock } = vi.hoisted(() => ({
  dmdCanvasMock: vi.fn(),
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
  Leva: () => null,
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

vi.mock("@frontend/ui", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const original = await importOriginal<typeof import("@frontend/ui")>()
  return { ...original, useDebugOverlayShown: () => false }
})

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

describe("dmd-screen App game over events", () => {
  beforeEach(() => {
    cleanup()
    dmdCanvasMock.mockClear()
    useScreenHubMock.mockClear()
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
})
