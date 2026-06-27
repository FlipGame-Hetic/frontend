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
  // How far the plunger is pulled, from 0 at rest to 1 at full charge
  position: number
  // Whether the key was held last frame, used to detect the exact frame it is let go
  wasHeld: boolean
  // The rod is springing back toward rest
  releasing: boolean
  // A release was accepted and we are in the short delay before the rod springs back
  pendingRelease: boolean
  // Counts the release delay down to zero
  releaseTimer: number
  // After a launch, hold the spring back until the ball has left the plunger area
  waitForBallClear: boolean
  // Counts down the ball-clear timeout so the rod springs back even if the ball never leaves
  ballClearTimer: number
  // Last cabinet release token we already handled, lets us spot a fresh one
  lastReleaseToken: number
}

export interface PlungerSimInput {
  // Seconds since the last frame (deltaTime)
  dt: number
  // Keyboard plunger key is held this frame
  isHeld: boolean
  // Cabinet's IOT plunger is physically held this frame
  isExternallyHeld: boolean
  // Monotonic token the cabinet bumps once per release
  releaseToken: number
  // Cabinet reports it has let the plunger go
  released: boolean
  // Charge the cabinet reports, from 0 to 1
  externalPosition: number
  // A ball is currently sitting in the lane
  hasBallInLane: boolean
}

// Commands that the state machine asks to trigger, but does not run itself. The usePlungerSimulation turn them into real physics, sounds...
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

  // The pull was below the minimum charge, treat it as noise and just snap back to rest
  if (charge < PLUNGER_MIN_CHARGE) {
    state.position = 0
    return
  }

  if (hasBallInLane) {
    // Below the launch threshold, the pull is too weak to fire the ball, it plays a soft bump instead of truly launching
    const isLaunch = charge >= PLUNGER_MIN_LAUNCH_CHARGE
    commands.playSfx = isLaunch ? "plunger_launch" : "flipper_up"

    if (isLaunch) {
      commands.launch = { charge }
    }
    // Hold the spring-back until the ball has left the area (or the timeout) so the plunger can't hit it twice in the same launch
    state.waitForBallClear = true
    state.ballClearTimer = PLUNGER_BALL_CLEAR_TIMEOUT
  } else {
    // Nothing to hit, so the rod can spring back right away without waiting for a ball
    state.waitForBallClear = false
    state.ballClearTimer = 0
  }

  state.pendingRelease = true
  state.releaseTimer = PLUNGER_RELEASE_DELAY
}

// Advances the plunger state machine one frame and returns the next state
export const advancePlungerState = (
  prev: PlungerSimState,
  input: PlungerSimInput,
): { state: PlungerSimState; commands: PlungerSimCommands } => {
  // Copy so the function stays pure and the caller keeps the previous state until it is swapped
  const state: PlungerSimState = { ...prev }
  const commands: PlungerSimCommands = { wakeBall: false }
  const { dt, isHeld, isExternallyHeld, releaseToken, released, externalPosition } = input

  // A fresh release token from the cabinet means a new launch event, take its reported charge and let go
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

    // Checks if the cabinet is physically holding the plungerThe cabinet is physically holding the plunger
  } else if (isExternallyHeld && !state.releasing && !state.pendingRelease) {
    commands.wakeBall = true
    // Mirror the reported external position instead of charging on a timer
    state.position = clampPlungerPosition(externalPosition)
  } else if (!state.releasing && !state.pendingRelease) {
    // On keyboard, charge while the PLUNGER_KEYBOARD_KEY is held, release when it comes back up
    if (isHeld) {
      // First frame of a hold, wake the ball so it can be launched
      if (!state.wasHeld) {
        commands.wakeBall = true
      }

      // Charge rises by one full unit over {PLUNGER_MAX_CHARGE_TIME} seconds
      state.position = clampPlungerPosition(state.position + dt / PLUNGER_MAX_CHARGE_TIME)
    }

    // When the key went from 'held' to 'up' at this frame, we release
    if (state.wasHeld && !isHeld) {
      releaseFromPosition(state, commands, input.hasBallInLane)
    }
  }

  // Once a release is pending, wait out the short delay then check if the ball has left the area before springing back
  if (state.pendingRelease) {
    if (state.releaseTimer > 0) {
      state.releaseTimer -= dt
    } else if (state.waitForBallClear && input.hasBallInLane && state.ballClearTimer > 0) {
      // Ball is still in the area, keep waiting until it leaves or the timeout runs out
      state.ballClearTimer -= dt
    } else {
      state.waitForBallClear = false
      state.ballClearTimer = 0
      state.pendingRelease = false
      state.releasing = true
    }
  }

  // Spring the plunger rod back toward rest at a fixed speed
  if (state.releasing) {
    state.position = Math.max(state.position - dt * PLUNGER_RELEASE_SPEED, 0)
    if (state.position <= 0) {
      state.releasing = false
    }
  }

  state.wasHeld = isHeld

  return { state, commands }
}
