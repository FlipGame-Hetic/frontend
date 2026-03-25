import useBallStore from "@/stores/useBallStore"
import { useControls, button } from "leva"
import Ball from "./Ball"

const spawnConfig = { x: 0 }

const BallsManager = () => {
  const { balls, spawnBall } = useBallStore()

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

  return (
    <>
      {balls.map((ball) => (
        <Ball key={ball.id} id={ball.id} position={ball.position} />
      ))}
    </>
  )
}

export default BallsManager
