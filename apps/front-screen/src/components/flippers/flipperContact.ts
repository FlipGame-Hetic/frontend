// Tracks which balls rest on a flipper (with a short linger for cradle micro-bounces) so the watchdog leaves a deliberate cradle alone
const FLIPPER_CONTACT_LINGER_MS = 250

// Balls currently touching a flipper, keyed by ball id
const contacts = new Set<string>()
// When each ball last left a flipper, used for the linger window
const lastExitAt = new Map<string, number>()

export const markFlipperContact = (ballId: string): void => {
  contacts.add(ballId)
}

export const clearFlipperContact = (ballId: string): void => {
  contacts.delete(ballId)
  lastExitAt.set(ballId, performance.now())
}

// True while the ball touches a flipper, and for a short linger afterwards
export const isBallOnFlipper = (ballId: string): boolean => {
  if (contacts.has(ballId)) return true
  const exitAt = lastExitAt.get(ballId)
  return exitAt !== undefined && performance.now() - exitAt < FLIPPER_CONTACT_LINGER_MS
}

// Drops all state for a ball once it is gone, called from the ball's unmount cleanup
export const forgetFlipperContact = (ballId: string): void => {
  contacts.delete(ballId)
  lastExitAt.delete(ballId)
}
