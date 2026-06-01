/**
 * Module-level singleton for pressed keys.
 * Both useKeyboard (hardware) and useIoTInputs (WebSocket) write here.
 * Components read via useKeyboard() which returns a ref to this set.
 */
const pressedKeys = new Set<string>()
const listeners = new Set<() => void>()
const plungerInput = {
  position: 0,
  released: true,
  releaseToken: 0,
}

const notify = (): void => {
  listeners.forEach((listener) => {
    listener()
  })
}

export const pressKey = (code: string): void => {
  if (pressedKeys.has(code)) return
  pressedKeys.add(code)
  notify()
}

export const releaseKey = (code: string): void => {
  if (!pressedKeys.delete(code)) return
  notify()
}

export const getPressedKeys = (): Set<string> => {
  return pressedKeys
}

/** Stable string snapshot for useSyncExternalStore. */
export const getPressedKeysSnapshot = (): string => {
  return [...pressedKeys].sort().join(",")
}

export const subscribePressedKeys = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export interface PlungerInputSnapshot {
  position: number
  released: boolean
  releaseToken: number
}

const clampPlungerPosition = (position: number): number => {
  if (!Number.isFinite(position)) return 0
  return Math.min(Math.max(position, 0), 1)
}

export const setPlungerPosition = (position: number): void => {
  const nextPosition = clampPlungerPosition(position)
  if (plungerInput.position === nextPosition && !plungerInput.released) return
  plungerInput.position = nextPosition
  plungerInput.released = false
  notify()
}

export const setPlungerReleased = (released: boolean): void => {
  if (released) {
    plungerInput.releaseToken += 1
  }
  if (plungerInput.released === released && !released) return
  plungerInput.released = released
  notify()
}

export const getPlungerInputSnapshot = (): PlungerInputSnapshot => {
  return { ...plungerInput }
}
