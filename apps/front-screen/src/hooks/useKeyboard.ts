import { useEffect, useRef } from "react"

const useKeyboard = () => {
  const pressedKeys = useRef<Set<string>>(new Set())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      pressedKeys.current.add(e.code)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.code)
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
