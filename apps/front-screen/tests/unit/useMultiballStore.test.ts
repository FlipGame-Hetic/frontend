import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Vector3Tuple } from "three"

const { addTraumaMock, broadcastEventMock, playSfxMock, spawnBallMock } = vi.hoisted(() => ({
  addTraumaMock: vi.fn(),
  broadcastEventMock: vi.fn(),
  playSfxMock: vi.fn(),
  spawnBallMock: vi.fn(),
}))

vi.mock("@/audio/soundEngine", () => ({
  playSfx: playSfxMock,
}))

vi.mock("@/stores/useBallStore", () => ({
  default: {
    getState: () => ({ spawnBall: spawnBallMock }),
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

import useMultiballStore from "@/stores/useMultiballStore"

const POS_1: Vector3Tuple = [-2.7, 1.6, -4.1]
const POS_2: Vector3Tuple = [2.1, 1.6, -4.1]

const registerBounce = (ballId = "ball-a", threshold = 9) =>
  useMultiballStore.getState().registerBounce(ballId, threshold, POS_1, POS_2, 150, 8000, 3)

describe("useMultiballStore", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
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
})
