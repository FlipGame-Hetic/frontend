import {
  clampPlungerPosition,
  PLUNGER_BALL_CLEAR_TIMEOUT,
  PLUNGER_MAX_CHARGE_TIME,
  PLUNGER_MIN_CHARGE,
  PLUNGER_MIN_LAUNCH_CHARGE,
  PLUNGER_RELEASE_DELAY,
  PLUNGER_RELEASE_SPEED,
} from "../plungerConfig"

export interface PlungerSimState {
  position: number
  wasHeld: boolean
  releasing: boolean
  pendingRelease: boolean
  releaseTimer: number
  waitForBallClear: boolean
  ballClearTimer: number
  lastReleaseToken: number
}

export interface PlungerSimInput {
  dt: number
  isHeld: boolean
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
  wasHeld: false,
  releasing: false,
  pendingRelease: false,
  releaseTimer: 0,
  waitForBallClear: false,
  ballClearTimer: 0,
  lastReleaseToken,
})

// When the plunger is let go, decides whether the charge launches the ball, only bumps it, or resets
const releaseFromPosition = (
  state: PlungerSimState,
  commands: PlungerSimCommands,
  hasBallInLane: boolean,
): void => {
  const charge = clampPlungerPosition(state.position)

  if (charge >= PLUNGER_MIN_CHARGE) {
    if (hasBallInLane) {
      // Below the launch threshold the pull is too weak to fire the ball, it plays a soft bump instead of launching
      const isLaunch = charge >= PLUNGER_MIN_LAUNCH_CHARGE
      commands.playSfx = isLaunch ? "plunger_launch" : "flipper_up"
      if (isLaunch) {
        commands.launch = { charge }
      }
      // After a launch, hold the spring-back until the ball has left the lane (or the timeout) so the plunger can't hit it twice
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

// Advances the plunger state machine one frame and returns the next state plus any side-effect commands
export const advancePlungerState = (
  prev: PlungerSimState,
  input: PlungerSimInput,
): { state: PlungerSimState; commands: PlungerSimCommands } => {
  const state: PlungerSimState = { ...prev }
  const commands: PlungerSimCommands = { wakeBall: false }
  const { dt, isHeld, isExternallyHeld, releaseToken, released, externalPosition } = input

  // When the cabinet sends a fresh release token, it should use the reported charge and let go
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
    // Cabinet is physically holding the plunger : mirror its reported position
    commands.wakeBall = true
    state.position = clampPlungerPosition(externalPosition)
  } else if (!state.releasing && !state.pendingRelease) {
    // On keyboard, charge while the PLUNGER_KEY is held, release when it comes back up
    if (isHeld) {
      if (!state.wasHeld) {
        commands.wakeBall = true
      }
      state.position = clampPlungerPosition(state.position + dt / PLUNGER_MAX_CHARGE_TIME)
    }

    if (state.wasHeld && !isHeld) {
      releaseFromPosition(state, commands, input.hasBallInLane)
    }
  }

  // When released, wait for a short delay then check is the ball has left the lane
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

  // Then spring the plunger rod back toward rest
  if (state.releasing) {
    state.position = Math.max(state.position - dt * PLUNGER_RELEASE_SPEED, 0)
    if (state.position <= 0) {
      state.releasing = false
    }
  }

  state.wasHeld = isHeld

  return { state, commands }
}
