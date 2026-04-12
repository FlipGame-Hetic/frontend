import { useCallback, useMemo, useState } from "react"
import type { GameMessage } from "@frontend/types"
import { useGameSocket } from "@frontend/ws"
import { DEFAULT_DMD_CONFIG } from "@/dmd/config"
import type { DmdConfig } from "@/dmd/config"
import { DmdCanvas } from "@/dmd/DmdCanvas"
import { DevOverlay } from "@/components/DevOverlay"
import { SceneManager } from "@/dmd/SceneManager"
import type { Scene } from "@/dmd/types"

function App() {
  const [config, setConfig] = useState<DmdConfig>(DEFAULT_DMD_CONFIG)
  const sceneManager = useMemo(() => new SceneManager(), [])
  const [activeScene, setActiveScene] = useState<Scene>(() => sceneManager.activeScene)

  const onMessage = useCallback(
    (message: GameMessage) => {
      if (message._type === "GameState") {
        sceneManager.update({
          state: message.state as string,
          ball_number: message.ball_number as number,
          score: message.score as number,
          player: message.player as number,
          total_players: message.total_players as number,
        })
        setActiveScene(sceneManager.activeScene)
      }
    },
    [sceneManager],
  )

  useGameSocket({ onMessage })

  return (
    <>
      <DmdCanvas config={config} scene={activeScene} />
      {import.meta.env.DEV && <DevOverlay config={config} onChange={setConfig} />}
    </>
  )
}

export default App
