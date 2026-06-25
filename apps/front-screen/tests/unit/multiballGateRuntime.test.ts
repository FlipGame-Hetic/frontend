import { describe, expect, it } from "vitest"
import {
  MULTIBALL_GATE_CLOSE_DURATION_MS,
  MULTIBALL_GATE_CLOSE_TRIGGER_Z,
  MULTIBALL_GATE_OPEN_DURATION_MS,
  MULTIBALL_GATE_REOPEN_DELAY_MS,
} from "@/components/bonusZone/bonusZoneConfig"
import {
  advanceMultiballGateState,
  createOpenMultiballGateState,
  hasClearedMultiballGate,
  shouldCloseMultiballGateFromSensor,
  shouldCloseMultiballGateFromSensorExit,
  shouldTrackMultiballGateSensorBall,
  triggerMultiballGateClose,
} from "@/components/bonusZone/multiballGate/multiballGateRuntime"

const makeSensorPayload = (name: string, zVelocity: number | null) =>
  ({
    other: {
      rigidBodyObject: { name },
      rigidBody:
        zVelocity === null
          ? null
          : {
              linvel: () => ({ x: 0, y: 0, z: zVelocity }),
            },
    },
  }) as never

describe("multiballGateRuntime", () => {
  it("tracks sensor balls unless they are clearly exiting toward +Z", () => {
    expect(shouldTrackMultiballGateSensorBall(makeSensorPayload("wall", -2))).toBe(false)
    expect(shouldTrackMultiballGateSensorBall(makeSensorPayload("ball", null))).toBe(false)
    expect(shouldTrackMultiballGateSensorBall(makeSensorPayload("ball", 0))).toBe(true)
    expect(shouldTrackMultiballGateSensorBall(makeSensorPayload("ball", 0.05))).toBe(true)
    expect(shouldTrackMultiballGateSensorBall(makeSensorPayload("ball", -2))).toBe(true)
    expect(shouldTrackMultiballGateSensorBall(makeSensorPayload("ball", 2))).toBe(false)
  })

  it("closes only for balls moving from +Z toward -Z on sensor enter", () => {
    expect(shouldCloseMultiballGateFromSensor(makeSensorPayload("wall", 4))).toBe(false)
    expect(shouldCloseMultiballGateFromSensor(makeSensorPayload("ball", null))).toBe(false)
    expect(shouldCloseMultiballGateFromSensor(makeSensorPayload("ball", 0))).toBe(false)
    expect(shouldCloseMultiballGateFromSensor(makeSensorPayload("ball", 2))).toBe(false)
    expect(shouldCloseMultiballGateFromSensor(makeSensorPayload("ball", -2))).toBe(true)
  })

  it("closes on sensor exit when the ball cleared the gate toward -Z", () => {
    expect(
      shouldCloseMultiballGateFromSensorExit({ z: MULTIBALL_GATE_CLOSE_TRIGGER_Z }, { z: -2 }),
    ).toBe(true)
    expect(
      shouldCloseMultiballGateFromSensorExit(
        { z: MULTIBALL_GATE_CLOSE_TRIGGER_Z - 0.01 },
        { z: 2 },
      ),
    ).toBe(false)
    expect(
      shouldCloseMultiballGateFromSensorExit(
        { z: MULTIBALL_GATE_CLOSE_TRIGGER_Z + 0.01 },
        { z: -2 },
      ),
    ).toBe(false)
    expect(shouldCloseMultiballGateFromSensorExit(null, { z: -2 })).toBe(false)
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

  it("waits until the ball center has cleared the gate before closing", () => {
    expect(hasClearedMultiballGate(null)).toBe(false)
    expect(hasClearedMultiballGate({ z: MULTIBALL_GATE_CLOSE_TRIGGER_Z + 0.01 })).toBe(false)
    expect(hasClearedMultiballGate({ z: MULTIBALL_GATE_CLOSE_TRIGGER_Z })).toBe(true)
    expect(hasClearedMultiballGate({ z: MULTIBALL_GATE_CLOSE_TRIGGER_Z - 0.01 })).toBe(true)
  })
})
