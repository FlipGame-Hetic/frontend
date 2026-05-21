import useBallStore from "@/stores/useBallStore"
import useGameStore from "@/stores/useGameStore"
import type { PositionType } from "@/types/worldTypes"
import { isPointInPlungerLaneSensor, PLUNGER_BALL_SPAWN } from "@/components/plunger/plungerConfig"
import { usePhysicsDebugControls } from "@/debug/physicsDebugContext"
import { useControls, button } from "leva"
import { useCallback, useEffect } from "react"
import Ball from "./Ball"
import { DEFAULT_BALL_SPAWN } from "./ballConfig"

let _spawnX = DEFAULT_BALL_SPAWN[0]
let _spawnY = DEFAULT_BALL_SPAWN[1]
let _spawnZ = DEFAULT_BALL_SPAWN[2]

const BallsManager = () => {
  const { balls, spawnBall } = useBallStore()
  const phase = useGameStore((s) => s.phase)
  const ballNumber = useGameStore((s) => s.ballNumber)

  useEffect(() => {
    if (phase !== "playing") return
    spawnBall(PLUNGER_BALL_SPAWN)
  }, [phase, ballNumber, spawnBall])

  const handleSpawn = useCallback(() => {
    const position: PositionType = [_spawnX, _spawnY, _spawnZ]
    const isPlaying = !isPointInPlungerLaneSensor({ x: _spawnX, y: _spawnY, z: _spawnZ })

    spawnBall(position, { isPlaying })
  }, [spawnBall])

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

  const {
    mass,
    restitution,
    friction,
    linearDamping,
    angularDamping,
    maxTangentSpeed,
    laneMaxTangentSpeed,
    minNormalSpeed,
    maxNormalSpeed,
  } = usePhysicsDebugControls().ball

  useControls("Ball Spawner", {
    spawnX: {
      value: DEFAULT_BALL_SPAWN[0],
      min: -3.5,
      max: 3.3,
      step: 0.05,
      onChange: (v: number) => {
        _spawnX = v
      },
    },
    spawnY: {
      value: DEFAULT_BALL_SPAWN[1],
      min: -0.5,
      max: 3.5,
      step: 0.05,
      onChange: (v: number) => {
        _spawnY = v
      },
    },
    spawnZ: {
      value: DEFAULT_BALL_SPAWN[2],
      min: -7,
      max: 7,
      step: 0.05,
      onChange: (v: number) => {
        _spawnZ = v
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
          mass={mass}
          restitution={restitution}
          friction={friction}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          maxTangentSpeed={maxTangentSpeed}
          laneMaxTangentSpeed={laneMaxTangentSpeed}
          minNormalSpeed={minNormalSpeed}
          maxNormalSpeed={maxNormalSpeed}
        />
      ))}
    </>
  )
}

export default BallsManager
