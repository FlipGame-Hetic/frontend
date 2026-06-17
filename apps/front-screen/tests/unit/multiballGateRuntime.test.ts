import { describe, expect, it } from "vitest"
import { BALL_RADIUS } from "@/components/balls/ballConfig"
import {
  MULTIBALL_GATE_CLOSE_DURATION_MS,
  MULTIBALL_GATE_HALF_EXTENTS,
  MULTIBALL_GATE_OPEN_DURATION_MS,
  MULTIBALL_GATE_REOPEN_DELAY_MS,
} from "@/components/playfield/bonusZoneConfig"
import {
  advanceMultiballGateState,
  classifyMultiballGateTraversal,
  createOpenMultiballGateState,
  shouldKeepMultiballGateExitSuppression,
  triggerMultiballGateClose,
} from "@/components/playfield/multiballGateRuntime"

describe("multiballGateRuntime", () => {
  it("closes for a fast ball crossing from +Z into the bonus zone in one step", () => {
    const traversal = classifyMultiballGateTraversal(
      { x: 0, y: 0, z: 0.8 },
      { x: 0, y: 0, z: -0.8 },
    )

    expect(traversal).toBe("entry-to-bonus")

    const open = createOpenMultiballGateState()
    const closed = traversal === "entry-to-bonus" ? triggerMultiballGateClose(open, 100) : open

    expect(closed.phase).toBe("closing")
    expect(closed.colliderActive).toBe(true)
  })

  it("does not close for a ball exiting the bonus zone toward +Z", () => {
    const traversal = classifyMultiballGateTraversal(
      { x: 0, y: 0, z: -0.8 },
      { x: 0, y: 0, z: 0.8 },
    )

    expect(traversal).toBe("exit-to-playfield")
  })

  it("ignores crossings outside the gate bounds", () => {
    const outsideX = MULTIBALL_GATE_HALF_EXTENTS[0] + BALL_RADIUS + 0.01

    expect(
      classifyMultiballGateTraversal({ x: outsideX, y: 0, z: 0.8 }, { x: outsideX, y: 0, z: -0.8 }),
    ).toBe("none")
  })

  it("keeps suppressing close when an exiting ball bounces back inside the gate volume", () => {
    const exiting = classifyMultiballGateTraversal({ x: 0, y: 0, z: -0.3 }, { x: 0, y: 0, z: 0 })
    expect(exiting).toBe("exit-to-playfield")
    expect(shouldKeepMultiballGateExitSuppression({ x: 0, y: 0, z: 0 })).toBe(true)

    const bounceBack = classifyMultiballGateTraversal(
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: -0.25 },
    )
    expect(bounceBack).toBe("entry-to-bonus")
    expect(shouldKeepMultiballGateExitSuppression({ x: 0, y: 0, z: -0.25 })).toBe(true)

    expect(
      shouldKeepMultiballGateExitSuppression({
        x: 0,
        y: 0,
        z: MULTIBALL_GATE_HALF_EXTENTS[2] + BALL_RADIUS + 0.01,
      }),
    ).toBe(false)
  })

  it("activates the collider immediately and disables it when reopening starts", () => {
    const closed = triggerMultiballGateClose(createOpenMultiballGateState(), 100)

    expect(closed.phase).toBe("closing")
    expect(closed.colliderActive).toBe(true)
    expect(closed.reopenAt).toBe(100 + MULTIBALL_GATE_REOPEN_DELAY_MS)

    const closedAfterAnimation = advanceMultiballGateState(
      closed,
      100 + MULTIBALL_GATE_CLOSE_DURATION_MS,
    )
    expect(closedAfterAnimation.phase).toBe("closed")
    expect(closedAfterAnimation.closedAmount).toBe(1)
    expect(closedAfterAnimation.colliderActive).toBe(true)

    const reopening = advanceMultiballGateState(closedAfterAnimation, closed.reopenAt)
    expect(reopening.phase).toBe("opening")
    expect(reopening.colliderActive).toBe(false)

    const open = advanceMultiballGateState(
      reopening,
      closed.reopenAt + MULTIBALL_GATE_OPEN_DURATION_MS,
    )
    expect(open.phase).toBe("open")
    expect(open.closedAmount).toBe(0)
    expect(open.colliderActive).toBe(false)
  })

  it("does not re-close while the gate is reopening", () => {
    const closed = triggerMultiballGateClose(createOpenMultiballGateState(), 100)
    const closedAfterAnimation = advanceMultiballGateState(
      closed,
      100 + MULTIBALL_GATE_CLOSE_DURATION_MS,
    )
    const reopening = advanceMultiballGateState(closedAfterAnimation, closed.reopenAt)

    expect(reopening.phase).toBe("opening")

    const retriggered = triggerMultiballGateClose(reopening, closed.reopenAt + 20)

    expect(retriggered).toBe(reopening)
    expect(retriggered.phase).toBe("opening")
    expect(retriggered.colliderActive).toBe(false)
  })
})
