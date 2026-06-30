import useBallStore from "@/stores/useBallStore"
import useGameStore from "@/stores/useGameStore"
import { useDebugOverlayShown } from "@frontend/ui"
import { GAME_PHASE } from "@frontend/types"
import type { PositionType } from "@/types/worldTypes"
import { isPointInPlungerLaneSensor, PLUNGER_BALL_SPAWN } from "@/components/plunger/plungerConfig"
import { useCurrentBallColor } from "@/config/characterConfig"
import useKeyBinding from "@/hooks/useKeyBinding"
import { useControls, button } from "leva"
import { useCallback, useEffect, useRef, useState } from "react"
import Ball from "./Ball"
import BallSpawnPreview from "./preview/BallSpawnPreview"
import {
  DEFAULT_BALL_SPAWN,
  BALL_MASS,
  BALL_RESTITUTION,
  BALL_FRICTION,
  BALL_LINEAR_DAMPING,
  BALL_ANGULAR_DAMPING,
  BALL_MAX_TANGENT_SPEED,
  BALL_LANE_MAX_TANGENT_SPEED,
  BALL_MIN_NORMAL_SPEED,
  BALL_MAX_NORMAL_SPEED,
} from "./ballConfig"

const SPAWN_PREVIEW_HIDE_DELAY_MS = 1000

const BallsManager = () => {
  const { balls, spawnBall } = useBallStore()
  const phase = useGameStore((s) => s.phase)
  const ballNumber = useGameStore((s) => s.ballNumber)
  const ballColor = useCurrentBallColor()

  // Spawn position used when spawning a ball manually using Leva sliders
  const [spawnPos, setSpawnPos] = useState<[number, number, number]>([
    DEFAULT_BALL_SPAWN[0],
    DEFAULT_BALL_SPAWN[1],
    DEFAULT_BALL_SPAWN[2],
  ])
  // Mirror of spawnPos kept in a ref so the Leva button (whose callback is captured once) always reads the latest slider values
  const spawnPosRef = useRef(spawnPos)
  useEffect(() => {
    spawnPosRef.current = spawnPos
  }, [spawnPos])

  // Debug overlays (Leva + Stats) show in dev or on demand via window.debug() ; gate the spawn shortcuts the same way
  const overlayShown = useDebugOverlayShown()

  // Spawn preview used when spawning a ball manually using Leva sliders
  const [isSpawnPreviewVisible, setIsSpawnPreviewVisible] = useState(false)
  const spawnPreviewHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isEditingSpawnSliderRef = useRef(false)

  const clearSpawnPreviewHideTimeout = useCallback(() => {
    if (spawnPreviewHideTimeoutRef.current === null) return
    clearTimeout(spawnPreviewHideTimeoutRef.current)
    spawnPreviewHideTimeoutRef.current = null
  }, [])

  const showSpawnPreview = useCallback(() => {
    clearSpawnPreviewHideTimeout()
    setIsSpawnPreviewVisible(true)
  }, [clearSpawnPreviewHideTimeout])

  const scheduleSpawnPreviewHide = useCallback(() => {
    clearSpawnPreviewHideTimeout()
    spawnPreviewHideTimeoutRef.current = setTimeout(() => {
      setIsSpawnPreviewVisible(false)
      spawnPreviewHideTimeoutRef.current = null
    }, SPAWN_PREVIEW_HIDE_DELAY_MS)
  }, [clearSpawnPreviewHideTimeout])

  const setSpawnAxis = useCallback((axis: 0 | 1 | 2, value: number) => {
    setSpawnPos((prev) => {
      if (prev[axis] === value) return prev
      const next: [number, number, number] = [prev[0], prev[1], prev[2]]
      next[axis] = value
      return next
    })
  }, [])

  const handleSpawnSliderEditStart = useCallback(
    (axis: 0 | 1 | 2, value: number) => {
      isEditingSpawnSliderRef.current = true
      setSpawnAxis(axis, value)
      showSpawnPreview()
    },
    [setSpawnAxis, showSpawnPreview],
  )

  const handleSpawnSliderEditEnd = useCallback(
    (axis: 0 | 1 | 2, value: number) => {
      isEditingSpawnSliderRef.current = false
      setSpawnAxis(axis, value)
      showSpawnPreview()
      scheduleSpawnPreviewHide()
    },
    [scheduleSpawnPreviewHide, setSpawnAxis, showSpawnPreview],
  )

  const handleSpawnSliderChange = useCallback(
    (axis: 0 | 1 | 2, value: number, context?: { initial?: boolean }) => {
      setSpawnAxis(axis, value)
      if (context?.initial) return

      showSpawnPreview()
      if (!isEditingSpawnSliderRef.current) scheduleSpawnPreviewHide()
    },
    [scheduleSpawnPreviewHide, setSpawnAxis, showSpawnPreview],
  )

  useEffect(() => {
    return () => {
      clearSpawnPreviewHideTimeout()
    }
  }, [clearSpawnPreviewHideTimeout])

  // On entering Playing (or a new ball number) with no ball on the table, serve one into the plunger lane
  useEffect(() => {
    if (phase !== GAME_PHASE.Playing) return
    if (useBallStore.getState().balls.length > 0) return
    spawnBall(PLUNGER_BALL_SPAWN, { isPlaying: false })
  }, [phase, ballNumber, spawnBall])

  const handleSpawn = useCallback(() => {
    const [x, y, z] = spawnPosRef.current
    const position: PositionType = [x, y, z]
    // A hand-spawned ball counts as in-play unless it lands in the plunger lane, where it waits to be launched
    const isPlaying = !isPointInPlungerLaneSensor({ x, y, z })
    setIsSpawnPreviewVisible(false)
    spawnBall(position, { isPlaying })
  }, [spawnBall])

  const handleSpawnInPlunger = useCallback(() => {
    setIsSpawnPreviewVisible(false)
    spawnBall(PLUNGER_BALL_SPAWN, { isPlaying: false })
  }, [spawnBall])

  useKeyBinding("KeyS", handleSpawn, { enabled: overlayShown })
  useKeyBinding("KeyP", handleSpawnInPlunger, { enabled: overlayShown })

  useControls(
    "Ball Spawner",
    () => ({
      spawnX: {
        value: DEFAULT_BALL_SPAWN[0],
        min: -3.5,
        max: 3.3,
        step: 0.05,
        onEditStart: (v: number) => {
          handleSpawnSliderEditStart(0, v)
        },
        onEditEnd: (v: number) => {
          handleSpawnSliderEditEnd(0, v)
        },
        onChange: (v: number, _path: string, context: { initial?: boolean }) => {
          handleSpawnSliderChange(0, v, context)
        },
      },
      spawnY: {
        value: DEFAULT_BALL_SPAWN[1],
        min: -0.5,
        max: 3.5,
        step: 0.05,
        onEditStart: (v: number) => {
          handleSpawnSliderEditStart(1, v)
        },
        onEditEnd: (v: number) => {
          handleSpawnSliderEditEnd(1, v)
        },
        onChange: (v: number, _path: string, context: { initial?: boolean }) => {
          handleSpawnSliderChange(1, v, context)
        },
      },
      spawnZ: {
        value: DEFAULT_BALL_SPAWN[2],
        min: -7,
        max: 7,
        step: 0.05,
        onEditStart: (v: number) => {
          handleSpawnSliderEditStart(2, v)
        },
        onEditEnd: (v: number) => {
          handleSpawnSliderEditEnd(2, v)
        },
        onChange: (v: number, _path: string, context: { initial?: boolean }) => {
          handleSpawnSliderChange(2, v, context)
        },
      },
      "Spawn Ball": button(handleSpawn),
      "Spawn in plunger": button(handleSpawnInPlunger),
    }),
    { order: 1 },
  )

  return (
    <>
      {isSpawnPreviewVisible && <BallSpawnPreview position={spawnPos} color={ballColor} />}

      {balls.map((ball) => (
        <Ball
          key={ball.id}
          id={ball.id}
          position={ball.position}
          mass={BALL_MASS}
          restitution={BALL_RESTITUTION}
          friction={BALL_FRICTION}
          linearDamping={BALL_LINEAR_DAMPING}
          angularDamping={BALL_ANGULAR_DAMPING}
          maxTangentSpeed={BALL_MAX_TANGENT_SPEED}
          laneMaxTangentSpeed={BALL_LANE_MAX_TANGENT_SPEED}
          minNormalSpeed={BALL_MIN_NORMAL_SPEED}
          maxNormalSpeed={BALL_MAX_NORMAL_SPEED}
          color={ballColor}
        />
      ))}
    </>
  )
}

export default BallsManager
