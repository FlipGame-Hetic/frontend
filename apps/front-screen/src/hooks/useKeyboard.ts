import { useEffect, useRef, useSyncExternalStore } from "react"
import {
  getPressedKeys,
  getPressedKeysSnapshot,
  pressKey,
  releaseKey,
  subscribePressedKeys,
} from "@/stores/inputStore"

const useKeyboard = () => {
  useSyncExternalStore(subscribePressedKeys, getPressedKeysSnapshot, getPressedKeysSnapshot)

  const pressedKeys = useRef(getPressedKeys())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      pressKey(e.code)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      releaseKey(e.code)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  return pressedKeys
}

export default useKeyboard
