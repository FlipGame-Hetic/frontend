import {
  clampPlungerPosition,
  PLUNGER_BALL_CLEAR_TIMEOUT,
  PLUNGER_MAX_CHARGE_TIME,
  PLUNGER_MIN_CHARGE,
  PLUNGER_MIN_LAUNCH_CHARGE,
  PLUNGER_RELEASE_DELAY,
  PLUNGER_RELEASE_SPEED,
} from "./plungerConfig"

export interface PlungerSimState {
  position: number
  wasSpacePressed: boolean
  releasing: boolean
  pendingRelease: boolean
  releaseTimer: number
  waitForBallClear: boolean
  ballClearTimer: number
  lastReleaseToken: number
}

export interface PlungerSimInput {
  dt: number
  isSpacePressed: boolean
  isExternallyHeld: boolean
  releaseToken: number
  released: boolean
  externalPosition: number
  hasBallInLane: boolean
}

export interface PlungerSimCommands {
  wakeBall: boolean
  playSfx?: "plunger_launch" | "flipper_up"
  launch?: { charge: number }
}

export const createPlungerSimState = (lastReleaseToken: number): PlungerSimState => ({
  position: 0,
  wasSpacePressed: false,
  releasing: false,
  pendingRelease: false,
  releaseTimer: 0,
  waitForBallClear: false,
  ballClearTimer: 0,
  lastReleaseToken,
})

const releaseFromPosition = (
  state: PlungerSimState,
  commands: PlungerSimCommands,
  hasBallInLane: boolean,
): void => {
  const charge = clampPlungerPosition(state.position)

  if (charge >= PLUNGER_MIN_CHARGE) {
    if (hasBallInLane) {
      const isLaunch = charge >= PLUNGER_MIN_LAUNCH_CHARGE
      commands.playSfx = isLaunch ? "plunger_launch" : "flipper_up"
      if (isLaunch) {
        commands.launch = { charge }
      }
      state.waitForBallClear = true
      state.ballClearTimer = PLUNGER_BALL_CLEAR_TIMEOUT
    } else {
      state.waitForBallClear = false
      state.ballClearTimer = 0
    }

    state.pendingRelease = true
    state.releaseTimer = PLUNGER_RELEASE_DELAY
  } else {
    state.position = 0
  }
}

export const advancePlungerState = (
  prev: PlungerSimState,
  input: PlungerSimInput,
): { state: PlungerSimState; commands: PlungerSimCommands } => {
  const state: PlungerSimState = { ...prev }
  const commands: PlungerSimCommands = { wakeBall: false }
  const { dt, isSpacePressed, isExternallyHeld, releaseToken, released, externalPosition } = input

  if (
    releaseToken !== state.lastReleaseToken &&
    released &&
    !state.releasing &&
    !state.pendingRelease
  ) {
    state.lastReleaseToken = releaseToken
    state.position = clampPlungerPosition(externalPosition)
    commands.wakeBall = true
    releaseFromPosition(state, commands, input.hasBallInLane)
  } else if (isExternallyHeld && !state.releasing && !state.pendingRelease) {
    commands.wakeBall = true
    state.position = clampPlungerPosition(externalPosition)
  } else if (!state.releasing && !state.pendingRelease) {
    if (isSpacePressed) {
      if (!state.wasSpacePressed) {
        commands.wakeBall = true
      }
      state.position = clampPlungerPosition(state.position + dt / PLUNGER_MAX_CHARGE_TIME)
    }

    if (state.wasSpacePressed && !isSpacePressed) {
      releaseFromPosition(state, commands, input.hasBallInLane)
    }
  }

  if (state.pendingRelease) {
    if (state.releaseTimer > 0) {
      state.releaseTimer -= dt
    } else if (state.waitForBallClear && input.hasBallInLane && state.ballClearTimer > 0) {
      state.ballClearTimer -= dt
    } else {
      state.waitForBallClear = false
      state.ballClearTimer = 0
      state.pendingRelease = false
      state.releasing = true
    }
  }

  if (state.releasing) {
    state.position = Math.max(state.position - dt * PLUNGER_RELEASE_SPEED, 0)
    if (state.position <= 0) {
      state.releasing = false
    }
  }

  state.wasSpacePressed = isSpacePressed

  return { state, commands }
}
