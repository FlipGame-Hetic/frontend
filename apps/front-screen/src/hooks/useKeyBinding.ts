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

const MATCH_SEPARATOR = "\u001E"
const KEY_SEPARATOR = "\u001F"

const getKeysId = (keys: KeyBindingKeys, match: KeyMatchMode): string => {
  const normalizedKeys = getKeyList(keys).map((key) => normalizeKeyForMatch(key, match))
  return `${match}${MATCH_SEPARATOR}${normalizedKeys.join(KEY_SEPARATOR)}`
}

const getBindingConfigFromKeysId = (keysId: string): BindingConfig => {
  const separatorIndex = keysId.indexOf(MATCH_SEPARATOR)
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
  handler: (e: KeyboardEvent) => void,
  options: UseKeyBindingOptions = {},
): void => {
  const enabled = options.enabled ?? true
  const match = options.match ?? "code"
  const when = options.when
  const keysId = getKeysId(keys, match)
  const handlerRef = useRef(handler)
  const whenRef = useRef(when)

  useLayoutEffect(() => {
    handlerRef.current = handler
    whenRef.current = when
  }, [handler, when])

  useEffect(() => {
    if (!enabled) return

    const config = getBindingConfigFromKeysId(keysId)
    const binding: KeyBinding = {
      keys: config.keys,
      match: config.match,
      handler: (e) => {
        handlerRef.current(e)
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
