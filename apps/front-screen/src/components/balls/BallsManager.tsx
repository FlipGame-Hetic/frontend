import useBallStore from "@/stores/useBallStore"
import useGameStore from "@/stores/useGameStore"
import { PLUNGER_BALL_SPAWN } from "@/components/plunger/plungerConfig"
import { useControls, button } from "leva"
import { useEffect } from "react"
import Ball from "./Ball"
import { DEFAULT_BALL_SPAWN } from "./ballConfig"

const BallsManager = () => {
  const { balls, spawnBall } = useBallStore()
  const phase = useGameStore((s) => s.phase)
  const ballNumber = useGameStore((s) => s.ballNumber)

  useEffect(() => {
    if (phase !== "playing") return
    spawnBall(PLUNGER_BALL_SPAWN)
  }, [phase, ballNumber, spawnBall])

  useControls("Ball Spawner", {
    "Spawn Ball": button(() => {
      spawnBall(PLUNGER_BALL_SPAWN)
    }),
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
