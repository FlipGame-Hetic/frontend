import { beforeEach, describe, expect, it, vi } from "vitest"

const { broadcastEvent, startLoopingSfx, stopLoopingSfx } = vi.hoisted(() => ({
  broadcastEvent: vi.fn(),
  startLoopingSfx: vi.fn(),
  stopLoopingSfx: vi.fn(),
}))

vi.mock("@frontend/ws", () => ({
  broadcastEvent,
}))

vi.mock("@/audio/soundEngine", () => ({
  startLoopingSfx,
  stopLoopingSfx,
}))

const loadRailState = async () => {
  vi.resetModules()
  return import("@/components/playfield/railState")
}

describe("railState", () => {
  beforeEach(() => {
    broadcastEvent.mockClear()
    startLoopingSfx.mockClear()
    stopLoopingSfx.mockClear()
  })

  it("emits RailStart only once per ball", async () => {
    const { enterRail } = await loadRailState()

    enterRail("ball-1", "sensor-rail-left-entrance")
    enterRail("ball-1", "sensor-rail-right-entrance")

    expect(broadcastEvent).toHaveBeenCalledTimes(1)
    expect(broadcastEvent).toHaveBeenCalledWith({
      event_type: "RailStart",
      payload: { ball_id: "ball-1" },
    })
    expect(startLoopingSfx).toHaveBeenCalledTimes(1)
    expect(startLoopingSfx).toHaveBeenCalledWith("ramp_rolling", "ball-1")
  })

  it("forces RailEnd immediately from an exit sensor", async () => {
    const { enterRail, exitRailNow, isOnRail } = await loadRailState()

    enterRail("ball-1", "sensor-rail-left-entrance")
    exitRailNow("ball-1")

    expect(isOnRail("ball-1")).toBe(false)
    expect(broadcastEvent).toHaveBeenCalledTimes(2)
    expect(broadcastEvent).toHaveBeenLastCalledWith({
      event_type: "RailEnd",
      payload: { ball_id: "ball-1" },
    })
    expect(stopLoopingSfx).toHaveBeenCalledWith("ramp_rolling", "ball-1")
  })

  it("ignores an exit sensor for a ball that was not on a rail", async () => {
    const { exitRailNow, isOnRail } = await loadRailState()

    exitRailNow("ball-1")

    expect(isOnRail("ball-1")).toBe(false)
    expect(broadcastEvent).not.toHaveBeenCalled()
    expect(stopLoopingSfx).not.toHaveBeenCalled()
  })

  it("emits RailEnd when a rail ball is cleaned up", async () => {
    const { cleanupRailBall, enterRail, isOnRail } = await loadRailState()

    enterRail("ball-1", "sensor-rail-left-entrance")
    cleanupRailBall("ball-1")

    expect(isOnRail("ball-1")).toBe(false)
    expect(broadcastEvent).toHaveBeenCalledTimes(2)
    expect(broadcastEvent).toHaveBeenLastCalledWith({
      event_type: "RailEnd",
      payload: { ball_id: "ball-1" },
    })
  })
})
