import { useEffect, useRef } from "react"
import { getPressedKeys, pressKey, releaseKey } from "@/input/inputState"

const useKeyboard = () => {
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
