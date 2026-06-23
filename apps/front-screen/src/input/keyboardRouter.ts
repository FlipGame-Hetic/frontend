// e.code is used for modifiers keys such as ShiftLeft / ShiftRight, that an e.key would group in a single Shift. Whereas e.key is used for letters, to keep physical layout coherent among AZERTY and QWERTY keyboards
export type KeyMatchMode = "code" | "key"

export interface KeyBinding {
  keys: Set<string>
  match: KeyMatchMode
  handler: (e: KeyboardEvent) => void
  when?: () => boolean
}

const bindings = new Set<KeyBinding>()
let isListening = false

const isTypingTarget = (e: KeyboardEvent): boolean => {
  const target = e.target
  if (!(target instanceof Element)) return false

  return Boolean(
    (target instanceof HTMLElement && target.isContentEditable) ||
    target.closest("input, textarea, select"),
  )
}

export const normalizeKeyForMatch = (key: string, match: KeyMatchMode): string => {
  return match === "key" ? key.toLowerCase() : key
}

const getEventKey = (e: KeyboardEvent, match: KeyMatchMode): string => {
  return normalizeKeyForMatch(match === "key" ? e.key : e.code, match)
}

const handleKeyDown = (e: KeyboardEvent): void => {
  if (e.repeat || isTypingTarget(e)) return

  for (const binding of Array.from(bindings)) {
    const key = getEventKey(e, binding.match)
    if (!binding.keys.has(key)) continue
    if (binding.when?.() === false) continue

    binding.handler(e)
  }
}

export const registerBinding = (binding: KeyBinding): void => {
  bindings.add(binding)

  if (isListening) return
  window.addEventListener("keydown", handleKeyDown)
  isListening = true
}

export const unregisterBinding = (binding: KeyBinding): void => {
  bindings.delete(binding)

  if (bindings.size > 0 || !isListening) return
  window.removeEventListener("keydown", handleKeyDown)
  isListening = false
}
