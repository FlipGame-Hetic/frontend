import { useEffect, useRef } from "react"
import { getPressedKeys, pressKey, releaseKey } from "@/stores/inputStore"

const useKeyboard = () => {
  const pressedKeys = useRef<Set<string>>(getPressedKeys())

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
