import usePlayfieldReadyStore from "@/stores/usePlayfieldReadyStore"
import { easeOutCubic } from "@/utils/easing"
import { useProgress } from "@react-three/drei"
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"

const FAKE_PROGRESS_LIMIT = 95
const FADE_OUT_MS = 620

const getFakeProgressSpeed = (progress: number): number => {
  if (progress < 64) return 18
  if (progress < 86) return 7
  return 2.2
}

const getErrorLabel = (errors: string[]): string => {
  if (errors.length === 1) return "Asset introuvable"
  return "Assets introuvables"
}

const LoadingScreen = () => {
  const { active, progress, errors } = useProgress()
  const playfieldReady = usePlayfieldReadyStore((state) => state.ready)

  const [displayProgress, setDisplayProgress] = useState(0)
  const [fading, setFading] = useState(false)
  const [hidden, setHidden] = useState(false)

  const displayProgressRef = useRef(0)
  const fakeProgressRef = useRef(0)
  const revealStartedRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const previousFrameTimeRef = useRef<number | null>(null)

  const uniqueErrors = useMemo(() => Array.from(new Set(errors)), [errors])
  const hasErrors = uniqueErrors.length > 0
  const readyToReveal = !active && playfieldReady && !hasErrors

  useEffect(() => {
    if (hidden) return undefined

    const animateProgress = (time: number) => {
      const previousTime = previousFrameTimeRef.current ?? time
      const deltaSeconds = Math.min((time - previousTime) / 1000, 0.08)
      previousFrameTimeRef.current = time

      if (!readyToReveal && !hasErrors) {
        const fakeProgress = fakeProgressRef.current
        const nextFakeProgress =
          fakeProgress + getFakeProgressSpeed(fakeProgress) * deltaSeconds * easeOutCubic(0.35)
        fakeProgressRef.current = Math.min(
          FAKE_PROGRESS_LIMIT,
          Math.max(nextFakeProgress, progress),
        )
      }

      const targetProgress = readyToReveal
        ? 100
        : Math.min(FAKE_PROGRESS_LIMIT, Math.max(progress, fakeProgressRef.current))
      const nextProgress =
        displayProgressRef.current + (targetProgress - displayProgressRef.current) * 0.14

      displayProgressRef.current =
        Math.abs(targetProgress - nextProgress) < 0.12 ? targetProgress : nextProgress
      setDisplayProgress(displayProgressRef.current)

      rafRef.current = requestAnimationFrame(animateProgress)
    }

    rafRef.current = requestAnimationFrame(animateProgress)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [hasErrors, hidden, progress, readyToReveal])

  useEffect(() => {
    if (!readyToReveal || revealStartedRef.current) return undefined

    revealStartedRef.current = true
    displayProgressRef.current = 100

    const fadeFrame = requestAnimationFrame(() => {
      setDisplayProgress(100)
      setFading(true)
    })
    const hideTimeout = window.setTimeout(() => {
      setHidden(true)
    }, FADE_OUT_MS)

    return () => {
      cancelAnimationFrame(fadeFrame)
      window.clearTimeout(hideTimeout)
    }
  }, [readyToReveal])

  if (hidden) return null

  const roundedProgress = Math.round(displayProgress)
  const progressStyle = {
    "--loading-progress-ratio": String(Math.min(1, Math.max(0, displayProgress / 100))),
  } as CSSProperties

  return (
    <div
      className={`loading-screen${fading ? "loading-screen--fading" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy={!hasErrors && !readyToReveal}
    >
      <div className="loading-screen__grid" />
      <div className="loading-screen__frame" style={progressStyle}>
        <div className="loading-screen__kicker">initialisation playfield</div>
        <div className="loading-screen__title">S.P.A.M.E.R.</div>

        {hasErrors ? (
          <div className="loading-screen__error">
            <div className="loading-screen__error-title">{getErrorLabel(uniqueErrors)}</div>
            <div className="loading-screen__error-list">
              {uniqueErrors.slice(0, 3).map((error) => (
                <span key={error}>{error}</span>
              ))}
              {uniqueErrors.length > 3 ? <span>+{uniqueErrors.length - 3}</span> : null}
            </div>
            <button
              className="loading-screen__reload"
              type="button"
              onClick={() => {
                window.location.reload()
              }}
            >
              Recharger
            </button>
          </div>
        ) : (
          <>
            <div className="loading-screen__bar" aria-hidden="true">
              <div className="loading-screen__bar-fill" />
            </div>
            <div className="loading-screen__meta">
              <span>chargement</span>
              <span>{roundedProgress.toString().padStart(3, "0")}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default LoadingScreen
