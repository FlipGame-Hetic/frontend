import useBallStore from "@/stores/useBallStore"
import useGameStore from "@/stores/useGameStore"
import type { PositionType } from "@/types/worldTypes"
import { isPointInPlungerLaneSensor, PLUNGER_BALL_SPAWN } from "@/components/plunger/plungerConfig"
import { useControls, button } from "leva"
import { useCallback, useEffect, useState } from "react"
import Ball from "./Ball"
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

const BallsManager = () => {
  const { balls, spawnBall } = useBallStore()
  const phase = useGameStore((s) => s.phase)
  const ballNumber = useGameStore((s) => s.ballNumber)
  const [spawnPos, setSpawnPos] = useState<[number, number, number]>([
    DEFAULT_BALL_SPAWN[0],
    DEFAULT_BALL_SPAWN[1],
    DEFAULT_BALL_SPAWN[2],
  ])

  useEffect(() => {
    if (phase !== "playing") return
    if (useBallStore.getState().balls.length > 0) return
    spawnBall(PLUNGER_BALL_SPAWN, { isPlaying: false })
  }, [phase, ballNumber, spawnBall])

  const handleSpawn = useCallback(() => {
    const [x, y, z] = spawnPos
    const position: PositionType = [x, y, z]
    const isPlaying = !isPointInPlungerLaneSensor({ x, y, z })
    spawnBall(position, { isPlaying })
  }, [spawnPos, spawnBall])

  const handleSpawnInPlunger = useCallback(() => {
    spawnBall(PLUNGER_BALL_SPAWN, { isPlaying: false })
  }, [spawnBall])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null

      if (e.repeat || target?.isContentEditable || target?.closest("input, textarea, select")) {
        return
      }

      if (e.code === "KeyS") handleSpawn()
      else if (e.code === "KeyP") handleSpawnInPlunger()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleSpawn, handleSpawnInPlunger])

  useControls("Ball Spawner", {
    spawnX: {
      value: DEFAULT_BALL_SPAWN[0],
      min: -3.5,
      max: 3.3,
      step: 0.05,
      onChange: (v: number) => {
        setSpawnPos((prev) => [v, prev[1], prev[2]])
      },
    },
    spawnY: {
      value: DEFAULT_BALL_SPAWN[1],
      min: -0.5,
      max: 3.5,
      step: 0.05,
      onChange: (v: number) => {
        setSpawnPos((prev) => [prev[0], v, prev[2]])
      },
    },
    spawnZ: {
      value: DEFAULT_BALL_SPAWN[2],
      min: -7,
      max: 7,
      step: 0.05,
      onChange: (v: number) => {
        setSpawnPos((prev) => [prev[0], prev[1], v])
      },
    },
    "Spawn Ball": button(handleSpawn),
    "Spawn in plunger": button(handleSpawnInPlunger),
  })

  return (
    <>
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
        />
      ))}
    </>
  )
}

export default BallsManager
