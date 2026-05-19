/**
 * Module-level singleton for pressed keys.
 * Both useKeyboard (hardware) and useIoTInputs (WebSocket) write here.
 * Components read via useKeyboard() which returns a ref to this set.
 */
const pressedKeys = new Set<string>()
const listeners = new Set<() => void>()

function notify(): void {
  listeners.forEach((listener) => { listener(); })
}

export function pressKey(code: string): void {
  if (pressedKeys.has(code)) return
  pressedKeys.add(code)
  notify()
}

export function releaseKey(code: string): void {
  if (!pressedKeys.delete(code)) return
  notify()
}

export function getPressedKeys(): Set<string> {
  return pressedKeys
}

/** Stable string snapshot for useSyncExternalStore. */
export function getPressedKeysSnapshot(): string {
  return [...pressedKeys].sort().join(",")
}

export function subscribePressedKeys(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
