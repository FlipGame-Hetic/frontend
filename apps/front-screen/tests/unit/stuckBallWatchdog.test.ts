import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@react-three/rapier", () => ({}))

vi.mock("@/components/playfield/playfieldConfig", () => ({
  normalizedPlayfieldDirection: ({ x, z }: { x: number; y: number; z: number }) => {
    const len = Math.hypot(x, z)
    if (len < 0.001) return null
    return { x: x / len, y: 0, z: z / len }
  },
}))

import { createStuckBallWatchdog } from "@/components/physics/collision/stuckBallWatchdog"

function makeMockBody(speed: number) {
  return {
    linvel: () => ({ x: speed, y: 0, z: 0 }),
  }
}

describe("createStuckBallWatchdog", () => {
  const applyImpulse = vi.fn()
  const teleport = vi.fn()

  beforeEach(() => {
    applyImpulse.mockReset()
    teleport.mockReset()
  })

  const make = (overrides?: Partial<Parameters<typeof createStuckBallWatchdog>[0]>) =>
    createStuckBallWatchdog({
      stuckVelocity: 1,
      framesBeforeAttempt: 3,
      restuckFrames: 2,
      observeFrames: 10,
      maxImpulseAttempts: 2,
      applyImpulse,
      teleport,
      ...overrides,
    })

  const tickStuck = (watchdog: ReturnType<typeof make>, n: number) => {
    const body = makeMockBody(0)
    for (let i = 0; i < n; i += 1) watchdog.tick(body as never)
  }

  it("does not nudge before the initial frame threshold", () => {
    const watchdog = make()
    tickStuck(watchdog, 2)
    expect(applyImpulse).not.toHaveBeenCalled()
  })

  it("nudges once the initial threshold is reached", () => {
    const watchdog = make()
    tickStuck(watchdog, 3)
    expect(applyImpulse).toHaveBeenCalledOnce()
    expect(teleport).not.toHaveBeenCalled()
  })

  it("passes a normalized 2D direction (y = 0) to applyImpulse", () => {
    const watchdog = make()
    tickStuck(watchdog, 3)
    const [, dir] = applyImpulse.mock.calls[0] as [unknown, { x: number; y: number; z: number }]
    expect(dir.y).toBe(0)
    expect(Math.hypot(dir.x, dir.y, dir.z)).toBeCloseTo(1, 5)
  })

  it("does NOT escalate on the speed spike a nudge causes, only on a real re-stick", () => {
    const watchdog = make()
    tickStuck(watchdog, 3) // first nudge
    const fast = makeMockBody(5)
    // Speed stays high for a while (as right after an impulse) : no further nudge, no teleport
    for (let i = 0; i < 5; i += 1) watchdog.tick(fast as never)
    expect(applyImpulse).toHaveBeenCalledOnce()
    expect(teleport).not.toHaveBeenCalled()
  })

  it("escalates when the ball re-sticks inside the observation window", () => {
    const watchdog = make()
    tickStuck(watchdog, 3) // attempt 1
    tickStuck(watchdog, 2) // re-stick (restuckFrames) -> attempt 2
    expect(applyImpulse).toHaveBeenCalledTimes(2)
    expect(teleport).not.toHaveBeenCalled()
  })

  it("teleports after every nudge has failed", () => {
    const watchdog = make()
    tickStuck(watchdog, 3) // attempt 1
    tickStuck(watchdog, 2) // attempt 2 (maxImpulseAttempts reached)
    tickStuck(watchdog, 2) // re-stick again -> teleport
    expect(applyImpulse).toHaveBeenCalledTimes(2)
    expect(teleport).toHaveBeenCalledOnce()
  })

  it("counts the attempt as a success once the observation window elapses without a re-stick", () => {
    const watchdog = make()
    tickStuck(watchdog, 3) // attempt 1
    const fast = makeMockBody(5)
    for (let i = 0; i < 10; i += 1) watchdog.tick(fast as never) // survive observeFrames -> freed
    // Back to a fresh incident : it takes the full initial threshold again, not a single re-stick frame
    tickStuck(watchdog, 2)
    expect(applyImpulse).toHaveBeenCalledOnce()
    tickStuck(watchdog, 1)
    expect(applyImpulse).toHaveBeenCalledTimes(2)
  })

  it("reset() clears the pending escalation", () => {
    const watchdog = make()
    tickStuck(watchdog, 2)
    watchdog.reset()
    tickStuck(watchdog, 2)
    expect(applyImpulse).not.toHaveBeenCalled()
  })

  it("never nudges nor teleports while suppressed", () => {
    const watchdog = make({ isSuppressed: () => true })
    tickStuck(watchdog, 30)
    expect(applyImpulse).not.toHaveBeenCalled()
    expect(teleport).not.toHaveBeenCalled()
  })

  it("suppression checked just before the teleport stage blocks it", () => {
    let suppressed = false
    const watchdog = make({ isSuppressed: () => suppressed })
    tickStuck(watchdog, 3) // attempt 1
    tickStuck(watchdog, 2) // attempt 2 (maxImpulseAttempts reached)
    expect(applyImpulse).toHaveBeenCalledTimes(2)
    suppressed = true
    tickStuck(watchdog, 2) // would teleport, but suppressed -> reset instead
    expect(teleport).not.toHaveBeenCalled()
  })
})
