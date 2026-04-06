/**
 * Module-level singleton for pressed keys.
 * Both useKeyboard (hardware) and useIoTInputs (WebSocket) write here.
 * Components read via useKeyboard() which returns a ref to this set.
 */
const pressedKeys = new Set<string>()

export function pressKey(code: string): void {
  pressedKeys.add(code)
}

export function releaseKey(code: string): void {
  pressedKeys.delete(code)
}

export function getPressedKeys(): Set<string> {
  return pressedKeys
}
