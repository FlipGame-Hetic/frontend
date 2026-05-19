import useBallStore from "@/stores/useBallStore"
import useGameStore from "@/stores/useGameStore"
import { PLUNGER_BALL_SPAWN } from "@/components/plunger/plungerConfig"
import { useControls, button } from "leva"
import { useCallback, useEffect } from "react"
import Ball from "./Ball"
import { DEFAULT_BALL_SPAWN } from "./ballConfig"

let _spawnX = PLUNGER_BALL_SPAWN[0]
let _spawnY = PLUNGER_BALL_SPAWN[1]
let _spawnZ = PLUNGER_BALL_SPAWN[2]

const BallsManager = () => {
  const { balls, spawnBall } = useBallStore()
  const phase = useGameStore((s) => s.phase)
  const ballNumber = useGameStore((s) => s.ballNumber)

  useEffect(() => {
    if (phase !== "playing") return
    spawnBall(PLUNGER_BALL_SPAWN)
  }, [phase, ballNumber, spawnBall])

  const handleSpawn = useCallback(() => {
    spawnBall([_spawnX, _spawnY, _spawnZ])
  }, [spawnBall])

  useControls("Ball Spawner", {
    spawnX: {
      value: PLUNGER_BALL_SPAWN[0],
      min: -6,
      max: 6,
      step: 0.05,
      onChange: (v: number) => {
        _spawnX = v
      },
    },
    spawnY: {
      value: PLUNGER_BALL_SPAWN[1],
      min: -15,
      max: 20,
      step: 0.05,
      onChange: (v: number) => {
        _spawnY = v
      },
    },
    spawnZ: {
      value: PLUNGER_BALL_SPAWN[2],
      min: -12,
      max: 12,
      step: 0.05,
      onChange: (v: number) => {
        _spawnZ = v
      },
    },
    "Spawn Ball": button(handleSpawn),
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
