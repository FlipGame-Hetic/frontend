import { useEffect, useRef } from "react"

export function useAnimationFrame(
  callback: (deltaMs: number, elapsedMs: number) => void,
  fps = 60,
): void {
  const callbackRef = useRef(callback)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const prevRef = useRef<number>(0)
  const frameIntervalRef = useRef(1000 / fps)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    frameIntervalRef.current = fps > 0 ? 1000 / fps : 0
  }, [fps])

  useEffect(() => {
    function loop(time: number) {
      if (startRef.current === 0) {
        startRef.current = time
        prevRef.current = time
      }

      const frameInterval = frameIntervalRef.current
      if (frameInterval <= 0 || time - prevRef.current >= frameInterval) {
        const deltaMs = time - prevRef.current
        const elapsedMs = time - startRef.current
        prevRef.current = time

        callbackRef.current(deltaMs, elapsedMs)
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [])
}
