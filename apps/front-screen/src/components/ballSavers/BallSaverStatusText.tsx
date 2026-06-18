import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import type { CSSProperties } from "react"
import useTargetStore from "@/stores/useTargetStore"
import BallSaverCooldownRing from "./BallSaverCooldownRing"
import {
  BALL_SAVER_READY_TEXT,
  BALL_SAVER_STATUS_TEXT_CONFIG,
  getBallSaverStatusText,
  type BallSaverPhase,
  type BallSaverSide,
} from "./ballSaverConfig"

interface BallSaverStatusTextProps {
  phase: BallSaverPhase
  side: BallSaverSide
}

interface FlickerState {
  active: boolean
  endAt: number
  inBurst: boolean
  nextAt: number
  remainingBlinks: number
  startAt: number
}

const randomBetween = (min: number, max: number): number => {
  return min + Math.random() * (max - min)
}

const randomIntInclusive = (min: number, max: number): number => {
  return Math.floor(randomBetween(min, max + 1))
}

const scheduleNextBurst = (
  state: FlickerState,
  now: number,
  minDelay: number,
  maxDelay: number,
) => {
  state.active = false
  state.inBurst = false
  state.remainingBlinks = 0
  state.startAt = 0
  state.endAt = 0
  state.nextAt = now + randomBetween(minDelay, maxDelay)
}

const startBlink = (state: FlickerState, now: number, minDuration: number, maxDuration: number) => {
  state.active = true
  state.startAt = now
  state.endAt = now + randomBetween(minDuration, maxDuration)
}

const BallSaverStatusText = ({ phase, side }: BallSaverStatusTextProps) => {
  const config = BALL_SAVER_STATUS_TEXT_CONFIG[side]
  const text = useTargetStore((state) =>
    getBallSaverStatusText(side, state.activatedTargetIds, phase),
  )
  const elementRef = useRef<HTMLDivElement>(null)
  const flickerRef = useRef<FlickerState>({
    active: false,
    endAt: 0,
    inBurst: false,
    nextAt: 0,
    remainingBlinks: 0,
    startAt: 0,
  })

  useEffect(() => {
    const flicker = flickerRef.current
    scheduleNextBurst(
      flicker,
      performance.now(),
      config.flickerMinDelayMs,
      config.flickerMaxDelayMs,
    )
    if (elementRef.current) elementRef.current.style.opacity = "1"
  }, [config.flickerMaxDelayMs, config.flickerMinDelayMs, text])

  useFrame(() => {
    const element = elementRef.current
    if (!element) return

    const now = performance.now()
    const flicker = flickerRef.current

    if (flicker.nextAt === 0) {
      scheduleNextBurst(flicker, now, config.flickerMinDelayMs, config.flickerMaxDelayMs)
    }

    if (!flicker.active && now >= flicker.nextAt) {
      if (!flicker.inBurst) {
        flicker.inBurst = true
        flicker.remainingBlinks = randomIntInclusive(1, 3)
      }

      startBlink(flicker, now, config.flickerMinDurationMs, config.flickerMaxDurationMs)
      element.style.opacity = "0"
      return
    }

    if (!flicker.active) {
      element.style.opacity = "1"
      return
    }

    const duration = Math.max(1, flicker.endAt - flicker.startAt)
    const progress = Math.min(1, (now - flicker.startAt) / duration)
    element.style.opacity = progress.toFixed(3)

    if (progress >= 1) {
      flicker.remainingBlinks -= 1
      element.style.opacity = "1"

      if (flicker.remainingBlinks > 0) {
        flicker.active = false
        flicker.startAt = 0
        flicker.endAt = 0
        flicker.nextAt = now + randomBetween(config.flickerMinGapMs, config.flickerMaxGapMs)
        return
      }

      scheduleNextBurst(flicker, now, config.flickerMinDelayMs, config.flickerMaxDelayMs)
    }
  })

  const isCooldown = phase === "cooldown"

  if (text === null && !isCooldown) return null

  const style = {
    "--ball-saver-status-color": config.color,
    "--ball-saver-status-font-size": `${String(config.fontSize)}px`,
    "--ball-saver-status-letter-spacing": `${String(config.letterSpacing)}em`,
  } as CSSProperties

  const isReady = text === BALL_SAVER_READY_TEXT
  const dataState = isCooldown ? "cooldown" : isReady ? "ready" : "countdown"

  return (
    <group position={[...config.position]}>
      <Html
        center
        distanceFactor={config.distanceFactor}
        sprite
        transform
        zIndexRange={[config.renderOrder, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          ref={elementRef}
          className="ball-saver-status"
          data-state={dataState}
          data-side={side}
          style={style}
        >
          {isCooldown ? (
            <BallSaverCooldownRing side={side} />
          ) : isReady ? (
            text.split(" ").map((word) => (
              <span key={word} className="ball-saver-status__word">
                {word}
              </span>
            ))
          ) : (
            text
          )}
        </div>
      </Html>
    </group>
  )
}

export default BallSaverStatusText
