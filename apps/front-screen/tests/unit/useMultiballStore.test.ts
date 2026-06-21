import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Vector3Tuple } from "three"

const { addTraumaMock, ballStoreState, broadcastEventMock, playSfxMock, spawnBallMock } =
  vi.hoisted(() => ({
    addTraumaMock: vi.fn(),
    ballStoreState: { playingBallIds: [] as string[] },
    broadcastEventMock: vi.fn(),
    playSfxMock: vi.fn(),
    spawnBallMock: vi.fn(),
  }))

vi.mock("@/audio/soundEngine", () => ({
  playSfx: playSfxMock,
}))

vi.mock("@/stores/useBallStore", () => ({
  default: {
    getState: () => ({ playingBallIds: ballStoreState.playingBallIds, spawnBall: spawnBallMock }),
  },
}))

vi.mock("@/stores/useScreenShakeStore", () => ({
  default: {
    getState: () => ({ addTrauma: addTraumaMock }),
  },
}))

vi.mock("@frontend/ws", () => ({
  broadcastEvent: broadcastEventMock,
  registerScreenSender: vi.fn(),
}))

import useMultiballStore, { getMultiballDebugSnapshot } from "@/stores/useMultiballStore"

const POS_1: Vector3Tuple = [-2.7, 1.6, -4.1]
const POS_2: Vector3Tuple = [2.1, 1.6, -4.1]

const registerBounce = (ballId = "ball-a", threshold = 9) =>
  useMultiballStore.getState().registerBounce({
    ballId,
    threshold,
    spawnPositions: [POS_1, POS_2],
    spawnIntervalMs: 150,
    ballCount: 3,
  })

describe("useMultiballStore", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    ballStoreState.playingBallIds = []
    useMultiballStore.getState().reset()
    addTraumaMock.mockClear()
    broadcastEventMock.mockClear()
    playSfxMock.mockClear()
    spawnBallMock.mockClear()
  })

  afterEach(() => {
    useMultiballStore.getState().reset()
    vi.useRealTimers()
  })

  it("returns remaining hits after accepted progress", () => {
    const result = registerBounce("ball-a", 9)

    expect(result).toEqual({ status: "progress", remaining: 8 })
    expect(useMultiballStore.getState().bounceCount).toBe(1)
    expect(playSfxMock).toHaveBeenCalledWith("hit0")
  })

  it("returns triggered on the threshold hit without returning 0", () => {
    expect(registerBounce("ball-a", 2)).toEqual({ status: "progress", remaining: 1 })

    vi.advanceTimersByTime(201)
    const result = registerBounce("ball-a", 2)

    expect(result).toEqual({ status: "triggered" })
    expect(result).not.toMatchObject({ remaining: 0 })
    expect(broadcastEventMock).toHaveBeenCalledWith({
      event_type: "MultiballTriggered",
      payload: { ball_id: "ball-a" },
    })
  })

  it("ignores debounced hits", () => {
    expect(registerBounce("ball-a", 9)).toEqual({ status: "progress", remaining: 8 })

    const result = registerBounce("ball-a", 9)

    expect(result).toEqual({ status: "ignored" })
    expect(useMultiballStore.getState().bounceCount).toBe(1)
  })

  it("prunes expired debounce entries", () => {
    expect(registerBounce("ball-a", 9)).toEqual({ status: "progress", remaining: 8 })

    vi.advanceTimersByTime(201)

    expect(getMultiballDebugSnapshot().lastBounceTimes).toBe(0)
  })

  it("ignores hits while a multiball is already active without changing the counter", () => {
    expect(registerBounce("ball-a", 9)).toEqual({ status: "progress", remaining: 8 })
    playSfxMock.mockClear()
    broadcastEventMock.mockClear()
    addTraumaMock.mockClear()

    ballStoreState.playingBallIds = ["ball-a", "ball-b"]

    const result = registerBounce("ball-b", 9)

    expect(result).toEqual({ status: "ignored" })
    expect(useMultiballStore.getState().bounceCount).toBe(1)
    expect(playSfxMock).not.toHaveBeenCalled()
    expect(broadcastEventMock).not.toHaveBeenCalled()
    expect(addTraumaMock).not.toHaveBeenCalled()
  })

  it("does not update the hit debounce while the multiball counter is locked", () => {
    ballStoreState.playingBallIds = ["ball-a", "ball-b"]

    expect(registerBounce("ball-a", 9)).toEqual({ status: "ignored" })
    expect(playSfxMock).not.toHaveBeenCalled()

    ballStoreState.playingBallIds = []

    expect(registerBounce("ball-a", 9)).toEqual({ status: "progress", remaining: 8 })
    expect(useMultiballStore.getState().bounceCount).toBe(1)
    expect(playSfxMock).toHaveBeenCalledWith("hit0")
  })

  it("ignores hits while triggered multiball spawns are still pending", () => {
    expect(registerBounce("ball-a", 1)).toEqual({ status: "triggered" })
    playSfxMock.mockClear()
    broadcastEventMock.mockClear()

    const result = registerBounce("ball-b", 9)

    expect(result).toEqual({ status: "ignored" })
    expect(useMultiballStore.getState().bounceCount).toBe(0)
    expect(playSfxMock).not.toHaveBeenCalled()
    expect(broadcastEventMock).not.toHaveBeenCalled()
  })
})
