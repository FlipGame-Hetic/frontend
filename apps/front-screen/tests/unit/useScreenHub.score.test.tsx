import { cleanup, render, act } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ScreenEnvelope } from "@frontend/types"
import { LEFT_KEYS, RIGHT_KEYS } from "@/components/flipperJoints/jointsConfig"
import { PLUNGER_KEY } from "@/components/plunger/plungerConfig"
import { getPlungerInputSnapshot, getPressedKeys, releaseKey } from "@/stores/inputStore"
import useGameStore from "@/stores/useGameStore"
import { useScreenHub } from "@/hooks/useScreenHub"

const { broadcastEventMock, sendMock, registerScreenSenderMock, useScreenHubBaseMock } = vi.hoisted(
  () => ({
    broadcastEventMock: vi.fn(),
    sendMock: vi.fn(),
    registerScreenSenderMock: vi.fn(),
    useScreenHubBaseMock: vi.fn(),
  }),
)

vi.mock("@frontend/ws", () => ({
  broadcastEvent: broadcastEventMock,
  registerScreenSender: registerScreenSenderMock,
  sendEventTo: vi.fn(),
  useScreenHub: useScreenHubBaseMock,
}))

function ScreenHubHarness() {
  useScreenHub()
  return null
}

const lastScreenHubOptions = (): { onEvent?: (envelope: ScreenEnvelope) => void } => {
  return useScreenHubBaseMock.mock.calls.at(-1)?.[0] as {
    onEvent?: (envelope: ScreenEnvelope) => void
  }
}

const releaseKnownInputKeys = (): void => {
  ;[...LEFT_KEYS, ...RIGHT_KEYS, PLUNGER_KEY].forEach(releaseKey)
}

describe("front-screen useScreenHub", () => {
  beforeEach(() => {
    cleanup()
    useGameStore.getState().reset()
    releaseKnownInputKeys()
    broadcastEventMock.mockClear()
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

    const options = lastScreenHubOptions()

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

  it("maps cabinet flipper state events to local input keys", () => {
    render(<ScreenHubHarness />)

    const options = lastScreenHubOptions()

    act(() => {
      options.onEvent?.({
        from: "backend",
        to: { kind: "screen", id: "front_screen" },
        event_type: "FlipperLeft",
        payload: { state: 1 },
      })
    })

    expect(LEFT_KEYS.every((key) => getPressedKeys().has(key))).toBe(true)
    expect(RIGHT_KEYS.every((key) => getPressedKeys().has(key))).toBe(false)

    act(() => {
      options.onEvent?.({
        from: "backend",
        to: { kind: "screen", id: "front_screen" },
        event_type: "FlipperLeft",
        payload: { state: 0 },
      })
    })

    expect(LEFT_KEYS.every((key) => !getPressedKeys().has(key))).toBe(true)
  })

  it("maps PlungerCharge hold and release to the Space input", () => {
    render(<ScreenHubHarness />)

    const options = lastScreenHubOptions()

    act(() => {
      options.onEvent?.({
        from: "backend",
        to: { kind: "screen", id: "front_screen" },
        event_type: "PlungerCharge",
        payload: { state: 1 },
      })
    })

    expect(getPressedKeys().has(PLUNGER_KEY)).toBe(true)

    act(() => {
      options.onEvent?.({
        from: "backend",
        to: { kind: "screen", id: "front_screen" },
        event_type: "PlungerCharge",
        payload: { state: 0 },
      })
    })

    expect(getPressedKeys().has(PLUNGER_KEY)).toBe(false)
  })

  it("launches the plunger at max charge when PlungerCharge release has no matching hold", () => {
    render(<ScreenHubHarness />)

    const options = lastScreenHubOptions()
    const before = getPlungerInputSnapshot().releaseToken

    act(() => {
      options.onEvent?.({
        from: "backend",
        to: { kind: "screen", id: "front_screen" },
        event_type: "PlungerCharge",
        payload: { state: 0 },
      })
    })

    expect(getPlungerInputSnapshot()).toMatchObject({
      position: 1,
      released: true,
      releaseToken: before + 1,
    })
  })

  it("turns capacity cabinet events into backend UltimateActivated events", () => {
    render(<ScreenHubHarness />)

    const options = lastScreenHubOptions()

    act(() => {
      options.onEvent?.({
        from: "backend",
        to: { kind: "screen", id: "front_screen" },
        event_type: "CapacityL2",
        payload: null,
      })
    })

    expect(broadcastEventMock).toHaveBeenCalledWith({
      event_type: "UltimateActivated",
      payload: { player_id: "1" },
    })
  })
})
