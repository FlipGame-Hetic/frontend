import { cleanup, render, act } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ScreenEnvelope } from "@frontend/types"
import { useScreenHubClient } from "@/hooks/useScreenHubClient"
import { useBackScreenStore } from "@/stores/useBackScreenStore"

const { fetchLeaderboardMock, registerScreenSenderMock, sendMock, useScreenHubMock } = vi.hoisted(
  () => ({
    fetchLeaderboardMock: vi.fn(),
    registerScreenSenderMock: vi.fn(),
    sendMock: vi.fn(),
    useScreenHubMock: vi.fn(),
  }),
)

vi.mock("@frontend/ws", () => ({
  registerScreenSender: registerScreenSenderMock,
  useScreenHub: useScreenHubMock,
}))

vi.mock("@/api/leaderboard", () => ({
  fetchLeaderboard: fetchLeaderboardMock,
}))

function ScreenHubClientHarness() {
  useScreenHubClient()
  return null
}

const lastScreenHubOptions = (): { onEvent?: (envelope: ScreenEnvelope) => void } => {
  return useScreenHubMock.mock.calls.at(-1)?.[0] as {
    onEvent?: (envelope: ScreenEnvelope) => void
  }
}

describe("back-screen useScreenHubClient", () => {
  beforeEach(() => {
    cleanup()
    fetchLeaderboardMock.mockReset()
    fetchLeaderboardMock.mockResolvedValue([])
    registerScreenSenderMock.mockClear()
    sendMock.mockClear()
    useScreenHubMock.mockClear()
    useScreenHubMock.mockReturnValue({
      status: "connected",
      send: sendMock,
      broadcast: vi.fn(),
      sendTo: vi.fn(),
    })
    useBackScreenStore.setState({
      phase: "playing",
      menuIndex: 0,
      selectedMode: null,
      selectedCharacter: null,
      score: 42,
      ballNumber: 3,
      leaderboard: [],
      bossId: null,
      bossHp: 0,
      bossMaxHp: 0,
      bossActive: false,
      bossDefeatedAt: 0,
      lastDamage: { at: 0, delta: 0, big: false },
    })
  })

  it("uses incoming GameOver final score and switches to game over", () => {
    render(<ScreenHubClientHarness />)

    const options = lastScreenHubOptions()

    act(() => {
      options.onEvent?.({
        from: "game_engine",
        to: { kind: "broadcast" },
        event_type: "GameOver",
        payload: { final_score: 9876 },
      })
    })

    expect(useBackScreenStore.getState()).toMatchObject({
      phase: "game_over",
      score: 9876,
    })
  })
})
