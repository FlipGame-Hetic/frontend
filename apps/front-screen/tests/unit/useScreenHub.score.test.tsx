import { cleanup, render, act } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ScreenEnvelope } from "@frontend/types"
import useGameStore from "@/stores/useGameStore"
import { useScreenHub } from "@/hooks/useScreenHub"

const { sendMock, registerScreenSenderMock, useScreenHubBaseMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  registerScreenSenderMock: vi.fn(),
  useScreenHubBaseMock: vi.fn(),
}))

vi.mock("@frontend/ws", () => ({
  broadcastEvent: vi.fn(),
  registerScreenSender: registerScreenSenderMock,
  sendEventTo: vi.fn(),
  useScreenHub: useScreenHubBaseMock,
}))

function ScreenHubHarness() {
  useScreenHub()
  return null
}

describe("front-screen useScreenHub", () => {
  beforeEach(() => {
    cleanup()
    useGameStore.getState().reset()
    sendMock.mockClear()
    registerScreenSenderMock.mockClear()
    useScreenHubBaseMock.mockClear()
    useScreenHubBaseMock.mockReturnValue({
      status: "connected",
      send: sendMock,
      broadcast: vi.fn(),
      sendTo: vi.fn(),
    })
  })

  it("broadcasts a ScoreUpdate when the game score changes", () => {
    render(<ScreenHubHarness />)

    act(() => {
      useGameStore.getState().setScore(1234)
    })

    expect(sendMock).toHaveBeenCalledWith({
      from: "front_screen",
      to: { kind: "broadcast" },
      event_type: "ScoreUpdate",
      payload: {
        score: 1234,
        player: 1,
        ball: 1,
      },
    })
  })

  it("uses incoming ScoreDelta totals as the live score", () => {
    render(<ScreenHubHarness />)

    const options = useScreenHubBaseMock.mock.calls.at(-1)?.[0] as {
      onEvent?: (envelope: ScreenEnvelope) => void
    }

    act(() => {
      options.onEvent?.({
        from: "backend",
        to: { kind: "screen", id: "front_screen" },
        event_type: "ScoreDelta",
        payload: {
          delta: 250,
          reason: "bumper",
          total: 250,
          ball_id: "ball-1",
        },
      })
    })

    expect(useGameStore.getState().score).toBe(250)
    expect(sendMock).toHaveBeenCalledWith({
      from: "front_screen",
      to: { kind: "broadcast" },
      event_type: "ScoreUpdate",
      payload: {
        score: 250,
        player: 1,
        ball: 1,
      },
    })
  })
})
