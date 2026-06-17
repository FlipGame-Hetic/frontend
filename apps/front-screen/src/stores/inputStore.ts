/**
 * Module-level singleton for pressed keys.
 * Keyboard and cabinet ScreenHub events write here.
 * Components read via useKeyboard() which returns a ref to this set.
 */
const pressedKeys = new Set<string>()
const plungerInput = {
  position: 0,
  released: true,
  releaseToken: 0,
}

export const pressKey = (code: string): void => {
  pressedKeys.add(code)
}

export const releaseKey = (code: string): void => {
  pressedKeys.delete(code)
}

export const getPressedKeys = (): Set<string> => {
  return pressedKeys
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

const setPlungerPosition = (position: number): void => {
  plungerInput.position = clampPlungerPosition(position)
  plungerInput.released = false
}

const setPlungerReleased = (released: boolean): void => {
  if (released) {
    plungerInput.releaseToken += 1
  }
  plungerInput.released = released
}

export const triggerPlungerMaxLaunch = (): void => {
  setPlungerPosition(1)
  setPlungerReleased(true)
}

export const getPlungerInputSnapshot = (): PlungerInputSnapshot => {
  return { ...plungerInput }
}
