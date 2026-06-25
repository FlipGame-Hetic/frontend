import { useEffect } from "react"
import { useThree } from "@react-three/fiber"

interface FrameRateLimiterProps {
  fps?: number
}

export default function FrameRateLimiter({ fps = 30 }: FrameRateLimiterProps) {
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    const minDelta = 1000 / fps
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (now - last >= minDelta - 1) {
        last = now
        invalidate()
      }
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
    }
  }, [fps, invalidate])

  return null
}
