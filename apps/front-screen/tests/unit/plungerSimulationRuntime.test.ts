import { describe, expect, it } from "vitest"
import {
  PLUNGER_BALL_CLEAR_TIMEOUT,
  PLUNGER_MAX_CHARGE_TIME,
  PLUNGER_MIN_CHARGE,
  PLUNGER_MIN_LAUNCH_CHARGE,
  PLUNGER_RELEASE_DELAY,
} from "@/components/plunger/plungerConfig"
import {
  advancePlungerState,
  createPlungerSimState,
  type PlungerSimInput,
  type PlungerSimState,
} from "@/components/plunger/simulation/plungerSimulationRuntime"

const makeInput = (overrides: Partial<PlungerSimInput> = {}): PlungerSimInput => ({
  dt: 0,
  isSpacePressed: false,
  isExternallyHeld: false,
  releaseToken: 0,
  released: true,
  externalPosition: 0,
  hasBallInLane: false,
  ...overrides,
})

describe("plungerSimulationRuntime", () => {
  it("charges from keyboard input and wakes the ball only on the initial press", () => {
    const firstFrame = advancePlungerState(
      createPlungerSimState(0),
      makeInput({ dt: PLUNGER_MAX_CHARGE_TIME / 2, isSpacePressed: true }),
    )

    expect(firstFrame.commands.wakeBall).toBe(true)
    expect(firstFrame.state.position).toBeCloseTo(0.5)
    expect(firstFrame.state.wasHeld).toBe(true)

    const heldFrame = advancePlungerState(
      firstFrame.state,
      makeInput({ dt: PLUNGER_MAX_CHARGE_TIME / 4, isSpacePressed: true }),
    )

    expect(heldFrame.commands.wakeBall).toBe(false)
    expect(heldFrame.state.position).toBeCloseTo(0.75)
  })

  it("turns a charged keyboard release into a launch command when a ball is in the lane", () => {
    const chargedState: PlungerSimState = {
      ...createPlungerSimState(0),
      position: PLUNGER_MIN_LAUNCH_CHARGE,
      wasHeld: true,
    }

    const { state, commands } = advancePlungerState(
      chargedState,
      makeInput({ hasBallInLane: true }),
    )

    expect(commands).toEqual({
      wakeBall: false,
      playSfx: "plunger_launch",
      launch: { charge: PLUNGER_MIN_LAUNCH_CHARGE },
    })
    expect(state.pendingRelease).toBe(true)
    expect(state.waitForBallClear).toBe(true)
    expect(state.releaseTimer).toBe(PLUNGER_RELEASE_DELAY)
    expect(state.ballClearTimer).toBe(PLUNGER_BALL_CLEAR_TIMEOUT)
  })

  it("plays a small release sound without launching below the launch threshold", () => {
    const chargedState: PlungerSimState = {
      ...createPlungerSimState(0),
      position: PLUNGER_MIN_CHARGE,
      wasHeld: true,
    }

    const { commands } = advancePlungerState(chargedState, makeInput({ hasBallInLane: true }))

    expect(commands).toEqual({
      wakeBall: false,
      playSfx: "flipper_up",
    })
  })

  it("drops tiny releases back to rest without entering the release animation", () => {
    const lowChargeState: PlungerSimState = {
      ...createPlungerSimState(0),
      position: PLUNGER_MIN_CHARGE / 2,
      wasHeld: true,
    }

    const { state, commands } = advancePlungerState(
      lowChargeState,
      makeInput({ hasBallInLane: true }),
    )

    expect(commands).toEqual({ wakeBall: false })
    expect(state.position).toBe(0)
    expect(state.pendingRelease).toBe(false)
    expect(state.releasing).toBe(false)
  })

  it("keeps the spring compressed until the launched ball clears the lane", () => {
    const chargedState: PlungerSimState = {
      ...createPlungerSimState(0),
      position: 0.5,
      wasHeld: true,
    }

    const released = advancePlungerState(chargedState, makeInput({ hasBallInLane: true })).state
    const afterDelay = advancePlungerState(
      released,
      makeInput({ dt: PLUNGER_RELEASE_DELAY, hasBallInLane: true }),
    ).state
    const stillBlocked = advancePlungerState(
      afterDelay,
      makeInput({ dt: PLUNGER_BALL_CLEAR_TIMEOUT / 2, hasBallInLane: true }),
    ).state

    expect(stillBlocked.pendingRelease).toBe(true)
    expect(stillBlocked.releasing).toBe(false)
    expect(stillBlocked.position).toBe(0.5)

    const cleared = advancePlungerState(stillBlocked, makeInput({ hasBallInLane: false })).state

    expect(cleared.pendingRelease).toBe(false)
    expect(cleared.releasing).toBe(true)
  })

  it("uses the external plunger release token for cabinet launches", () => {
    const held = advancePlungerState(
      createPlungerSimState(10),
      makeInput({
        isExternallyHeld: true,
        released: false,
        releaseToken: 10,
        externalPosition: 0.7,
        hasBallInLane: true,
      }),
    )

    expect(held.commands.wakeBall).toBe(true)
    expect(held.state.position).toBe(0.7)

    const released = advancePlungerState(
      held.state,
      makeInput({
        releaseToken: 11,
        externalPosition: 0.7,
        hasBallInLane: true,
      }),
    )

    expect(released.commands.wakeBall).toBe(true)
    expect(released.commands.launch).toEqual({ charge: 0.7 })
    expect(released.state.lastReleaseToken).toBe(11)
  })
})
