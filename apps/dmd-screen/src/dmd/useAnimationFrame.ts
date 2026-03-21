import { useEffect, useRef } from "react"

export function useAnimationFrame(callback: (deltaMs: number, elapsedMs: number) => void): void {
  const callbackRef = useRef(callback)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const prevRef = useRef<number>(0)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    function loop(time: number) {
      if (startRef.current === 0) {
        startRef.current = time
        prevRef.current = time
      }

      const deltaMs = time - prevRef.current
      const elapsedMs = time - startRef.current
      prevRef.current = time

      callbackRef.current(deltaMs, elapsedMs)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [])
}
