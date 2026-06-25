import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@react-three/rapier", () => ({}))

vi.mock("@/components/physics/playfieldPlane", () => ({
  normalizedPlayfieldDirection: ({ x, z }: { x: number; y: number; z: number }) => {
    const len = Math.hypot(x, z)
    if (len < 0.001) return null
    return { x: x / len, y: 0, z: z / len }
  },
}))

import { createStuckBallTracker } from "@/components/physics/collision/stuckBallTracker"

function makeMockBody(speed: number) {
  return {
    linvel: () => ({ x: speed, y: 0, z: 0 }),
    mass: () => 1,
    applyImpulse: vi.fn(),
  }
}

describe("createStuckBallTracker", () => {
  const unstick = vi.fn()

  beforeEach(() => {
    unstick.mockReset()
  })

  it("does not call unstick before frames threshold is reached", () => {
    const tracker = createStuckBallTracker({
      stuckVelocity: 1,
      stuckFrames: 3,
      unstick,
    })
    const body = makeMockBody(0)
    tracker.arm(body as never)
    tracker.tick()
    tracker.tick()
    expect(unstick).not.toHaveBeenCalled()
  })

  it("calls unstick exactly once after reaching the frame threshold", () => {
    const tracker = createStuckBallTracker({
      stuckVelocity: 1,
      stuckFrames: 3,
      unstick,
    })
    const body = makeMockBody(0)
    tracker.arm(body as never)
    tracker.tick()
    tracker.tick()
    tracker.tick()
    expect(unstick).toHaveBeenCalledOnce()
  })

  it("passes a normalized direction to unstick", () => {
    const tracker = createStuckBallTracker({
      stuckVelocity: 1,
      stuckFrames: 1,
      unstick,
    })
    const body = makeMockBody(0)
    tracker.arm(body as never)
    tracker.tick()
    const [, dir] = unstick.mock.calls[0] as [unknown, { x: number; y: number; z: number }]
    const len = Math.hypot(dir.x, dir.y, dir.z)
    expect(len).toBeCloseTo(1, 5)
  })

  it("clears state when ball speed exceeds stuckVelocity", () => {
    const tracker = createStuckBallTracker({
      stuckVelocity: 1,
      stuckFrames: 3,
      unstick,
    })
    const body = makeMockBody(0)
    tracker.arm(body as never)
    tracker.tick()

    const fastBody = makeMockBody(5)
    tracker.arm(fastBody as never)
    tracker.tick()

    expect(unstick).not.toHaveBeenCalled()
  })

  it("does nothing if tick is called without arm", () => {
    const tracker = createStuckBallTracker({
      stuckVelocity: 1,
      stuckFrames: 1,
      unstick,
    })
    tracker.tick()
    expect(unstick).not.toHaveBeenCalled()
  })

  it("resets after unstick — subsequent ticks without arm do nothing", () => {
    const tracker = createStuckBallTracker({
      stuckVelocity: 1,
      stuckFrames: 1,
      unstick,
    })
    const body = makeMockBody(0)
    tracker.arm(body as never)
    tracker.tick()
    tracker.tick()
    tracker.tick()
    expect(unstick).toHaveBeenCalledOnce()
  })
})
