import { useCallback, useMemo, useRef, useState } from "react"
import type { GameMessage } from "@frontend/types"
import { useGameSocket } from "@frontend/ws"
import { DEFAULT_DMD_CONFIG } from "@/dmd/config"
import type { DmdConfig } from "@/dmd/config"
import { DmdCanvas } from "@/dmd/DmdCanvas"
import { TestScene } from "@/dmd/scenes/TestScene"
import { ScoreScene } from "@/dmd/scenes/ScoreScene"
import { DevOverlay } from "@/components/DevOverlay"

function App() {
  const [config, setConfig] = useState<DmdConfig>(DEFAULT_DMD_CONFIG)

  const testScene = useMemo(() => new TestScene(), [])
  const scoreScene = useMemo(() => new ScoreScene(), [])
  const hasWsData = useRef(false)
  const [activeScene, setActiveScene] = useState<"test" | "score">("test")

  const onMessage = useCallback(
    (message: GameMessage) => {
      if (message._type === "GameState") {
        if (!hasWsData.current) {
          hasWsData.current = true
          setActiveScene("score")
        }
        scoreScene.update({
          score: message.score as number,
          player: message.player as number,
          totalPlayers: message.total_players as number,
          ballNumber: message.ball_number as number,
          phase: message.state as string,
        })
      }
    },
    [scoreScene],
  )

  useGameSocket({ onMessage })

  const scene = activeScene === "score" ? scoreScene : testScene

  return (
    <>
      <DmdCanvas config={config} scene={scene} />
      {import.meta.env.DEV && <DevOverlay config={config} onChange={setConfig} />}
    </>
  )
}

export default App
