import { cleanup, render, act } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ScreenEnvelope } from "@frontend/types"
import { LEFT_KEYS, RIGHT_KEYS } from "@/components/flippers/flipperConfig"
import { PLUNGER_KEY } from "@/components/plunger/plungerConfig"
import { getPlungerInputSnapshot, getPressedKeys, releaseKey } from "@/input/inputState"
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

  it("uses incoming GameOver final score and ends the local game", () => {
    render(<ScreenHubHarness />)

    act(() => {
      useGameStore.getState().startGame({
        mode: "solo",
        players: [{ player: 1, character: "enforcer" }],
      })
    })
    sendMock.mockClear()

    const options = lastScreenHubOptions()

    act(() => {
      options.onEvent?.({
        from: "game_engine",
        to: { kind: "broadcast" },
        event_type: "GameOver",
        payload: { final_score: 9876 },
      })
    })

    expect(useGameStore.getState()).toMatchObject({
      phase: "game_over",
      score: 9876,
    })
    expect(sendMock).toHaveBeenCalledWith({
      from: "front_screen",
      to: { kind: "broadcast" },
      event_type: "phase_change",
      payload: {
        phase: "game_over",
        ball: 1,
        player: 1,
        score: 9876,
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

  it("no longer reacts to capacity cabinet events (back is the ultimate state machine)", () => {
    render(<ScreenHubHarness />)

    const options = lastScreenHubOptions()

    act(() => {
      options.onEvent?.({
        from: "backend",
        to: { kind: "screen", id: "front_screen" },
        event_type: "CapacityL2",
        payload: {},
      })
    })

    expect(broadcastEventMock).not.toHaveBeenCalled()
  })

  it("broadcasts StartGame with the character slug", () => {
    render(<ScreenHubHarness />)

    const options = lastScreenHubOptions()

    act(() => {
      options.onEvent?.({
        from: "backend",
        to: { kind: "screen", id: "front_screen" },
        event_type: "start_game",
        payload: { mode: "solo", players: [{ player: 1, character: "viper" }] },
      })
    })

    expect(broadcastEventMock).toHaveBeenCalledWith({
      event_type: "StartGame",
      payload: { player_id: "1", character: "viper" },
    })
  })
})
