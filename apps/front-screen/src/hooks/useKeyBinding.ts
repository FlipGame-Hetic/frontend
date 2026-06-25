import { useEffect, useLayoutEffect, useRef } from "react"
import {
  normalizeKeyForMatch,
  registerBinding,
  unregisterBinding,
  type KeyBinding,
  type KeyMatchMode,
} from "@/input/keyboardRouter"

type KeyBindingKeys = string | readonly string[]

interface UseKeyBindingOptions {
  enabled?: boolean
  when?: () => boolean
  match?: KeyMatchMode
}

interface BindingConfig {
  keys: Set<string>
  match: KeyMatchMode
}

const getKeyList = (keys: KeyBindingKeys): readonly string[] => {
  return typeof keys === "string" ? [keys] : keys
}

// ASCII separators, chosen because they never appear in a key name
// Separates the match mode (e.key || e.code) from the actual key
const MATCH_SEPARATOR = "\u001E"
const KEY_SEPARATOR = "\u001F"

const getKeysId = (keys: KeyBindingKeys, match: KeyMatchMode): string => {
  const normalizedKeys = getKeyList(keys).map((key) => normalizeKeyForMatch(key, match))
  return `${match}${MATCH_SEPARATOR}${normalizedKeys.join(KEY_SEPARATOR)}`
}

// Decodes a keysId back into its match mode and key set
const getBindingConfigFromKeysId = (keysId: string): BindingConfig => {
  const separatorIndex = keysId.indexOf(MATCH_SEPARATOR)
  // Match mode sits before the separator and the encoded keys after it, a missing separator falls back to an empty key set
  const matchToken = separatorIndex === -1 ? keysId : keysId.slice(0, separatorIndex)
  const keysToken = separatorIndex === -1 ? "" : keysId.slice(separatorIndex + 1)
  const match: KeyMatchMode = matchToken === "key" ? "key" : "code"

  return {
    keys: new Set(keysToken.length > 0 ? keysToken.split(KEY_SEPARATOR) : []),
    match,
  }
}

const useKeyBinding = (
  keys: KeyBindingKeys,
  onPress: (e: KeyboardEvent) => void,
  options: UseKeyBindingOptions = {},
): void => {
  // 'enabled' toggles registration itself : flipping it adds or removes the key listener
  const enabled = options.enabled ?? true
  const match = options.match ?? "code"
  // 'when' is checked at each keypress, which differentiates it from 'enabled', the binding stays registered but the onPress is skipped while it returns false
  const when = options.when
  const keysId = getKeysId(keys, match)
  // Latest 'onPress' and 'when' held in refs so a new callback identity does not re-register the binding, it only happens one onMount or when the option's value changes
  const onPressRef = useRef(onPress)
  const whenRef = useRef(when)

  useLayoutEffect(() => {
    onPressRef.current = onPress
    whenRef.current = when
  }, [onPress, when])

  useEffect(() => {
    if (!enabled) return

    const config = getBindingConfigFromKeysId(keysId)
    const binding: KeyBinding = {
      keys: config.keys,
      match: config.match,
      onPress: (e) => {
        onPressRef.current(e)
      },
      when: () => whenRef.current?.() ?? true,
    }

    registerBinding(binding)
    return () => {
      unregisterBinding(binding)
    }
  }, [enabled, keysId])
}

export default useKeyBinding
