import useBallStore from "@/stores/useBallStore"
import useGameStore from "@/stores/useGameStore"
import { useControls, button } from "leva"
import { useEffect } from "react"
import { PLUNGER_BALL_SPAWN } from "../plunger/plungerConfig"
import Ball from "./Ball"

const spawnConfig = { x: 0 }

const BallsManager = () => {
  const { balls, spawnBall } = useBallStore()
  const phase = useGameStore((s) => s.phase)
  const ballNumber = useGameStore((s) => s.ballNumber)

  useControls("Game", {
    "Start Game": button(() => {
      useGameStore.getState().startGame()
    }),
  })

  useControls("Ball Spawner", {
    spawnX: {
      value: 0,
      min: -4,
      max: 4,
      step: 0.1,
      label: "Spawn X",
      onChange: (v: number) => {
        spawnConfig.x = v
      },
    },
    "Spawn Ball": button(() => {
      spawnBall([spawnConfig.x, 5, -8])
    }),
  })

  useEffect(() => {
    if (phase !== "playing") return
    if (useBallStore.getState().balls.length > 0) return
    spawnBall(PLUNGER_BALL_SPAWN)
  }, [phase, ballNumber, spawnBall])

  return (
    <>
      {balls.map((ball) => (
        <Ball key={ball.id} id={ball.id} position={ball.position} />
      ))}
    </>
  )
}

export default BallsManager
