import { useEffect, useRef } from "react"
import useBallSaverPhaseStore from "@/stores/useBallSaverPhaseStore"
import {
  BALL_SAVER_COOLDOWN_MS,
  BALL_SAVER_COOLDOWN_RING_CIRCUMFERENCE,
  BALL_SAVER_COOLDOWN_RING_RADIUS,
  BALL_SAVER_COOLDOWN_RING_STROKE_WIDTH,
  type BallSaverSide,
} from "./ballSaverConfig"

interface BallSaverCooldownRingProps {
  side: BallSaverSide
}

const BallSaverCooldownRing = ({ side }: BallSaverCooldownRingProps) => {
  const progressRef = useRef<SVGCircleElement>(null)
  const cooldownEndsAt = useBallSaverPhaseStore((state) => state.cooldownEndsAt[side])

  useEffect(() => {
    if (cooldownEndsAt === null) return undefined

    let frameId = 0

    const update = () => {
      const circle = progressRef.current
      if (!circle) return

      const remaining = cooldownEndsAt - performance.now()
      const progress = Math.min(1, Math.max(0, 1 - remaining / BALL_SAVER_COOLDOWN_MS))
      // Fill the ring by shrinking the dash offset from full circumference to 0 as the cooldown elapses
      circle.style.strokeDashoffset = (
        BALL_SAVER_COOLDOWN_RING_CIRCUMFERENCE *
        (1 - progress)
      ).toFixed(3)

      if (progress < 1) frameId = requestAnimationFrame(update)
    }

    // Store only provides the end time, a rAF loop animates the ring smoothly without a React render per frame
    frameId = requestAnimationFrame(update)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [cooldownEndsAt])

  return (
    <div className="ball-saver-cooldown">
      <span
        className="ball-saver-cooldown__disc"
        style={{ inset: `${(50 - BALL_SAVER_COOLDOWN_RING_RADIUS).toString()}%` }}
      />
      <svg className="ball-saver-cooldown__ring" viewBox="0 0 100 100" aria-hidden="true">
        <circle
          className="ball-saver-cooldown__track"
          cx="50"
          cy="50"
          r={BALL_SAVER_COOLDOWN_RING_RADIUS}
          strokeWidth={BALL_SAVER_COOLDOWN_RING_STROKE_WIDTH}
        />
        <circle
          ref={progressRef}
          className="ball-saver-cooldown__progress"
          cx="50"
          cy="50"
          r={BALL_SAVER_COOLDOWN_RING_RADIUS}
          strokeWidth={BALL_SAVER_COOLDOWN_RING_STROKE_WIDTH}
          strokeDasharray={BALL_SAVER_COOLDOWN_RING_CIRCUMFERENCE}
          strokeDashoffset={BALL_SAVER_COOLDOWN_RING_CIRCUMFERENCE}
        />
      </svg>
    </div>
  )
}

export default BallSaverCooldownRing
