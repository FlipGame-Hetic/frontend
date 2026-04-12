import { useCallback, useMemo, useRef, useState } from "react"
import type { ScreenEnvelope } from "@frontend/types"
import { useScreenSocket } from "@frontend/ws"
import { DEFAULT_DMD_CONFIG } from "@/dmd/config"
import type { DmdConfig } from "@/dmd/config"
import { DmdCanvas } from "@/dmd/DmdCanvas"
import { DevOverlay } from "@/components/DevOverlay"
import { SceneManager } from "@/dmd/SceneManager"
import type { GameData } from "@/dmd/SceneManager"
import type { Scene } from "@/dmd/types"

const SCREEN_ID = "dmd_screen" as const
const TOKEN =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SCREEN_TOKEN ?? "dev"

function App() {
  const [config, setConfig] = useState<DmdConfig>(DEFAULT_DMD_CONFIG)
  const sceneManager = useMemo(() => new SceneManager(), [])
  const [activeScene, setActiveScene] = useState<Scene>(() => sceneManager.activeScene)

  // Merged game state — updated incrementally from score_update and phase_change envelopes
  const gameData = useRef<GameData>({
    state: "idle",
    ball_number: 1,
    score: 0,
    player: 1,
    total_players: 1,
  })

  const onMessage = useCallback(
    (envelope: ScreenEnvelope) => {
      const payload = envelope.payload as Record<string, unknown>

      if (envelope.event_type === "score_update") {
        gameData.current = {
          ...gameData.current,
          score: (payload.score as number | undefined) ?? gameData.current.score,
          player: (payload.player as number | undefined) ?? gameData.current.player,
          ball_number: (payload.ball as number | undefined) ?? gameData.current.ball_number,
        }
      } else if (envelope.event_type === "phase_change") {
        gameData.current = {
          ...gameData.current,
          state: (payload.phase as string | undefined) ?? gameData.current.state,
          ball_number: (payload.ball as number | undefined) ?? gameData.current.ball_number,
          player: (payload.player as number | undefined) ?? gameData.current.player,
        }
      } else {
        return
      }

      sceneManager.update(gameData.current)
      setActiveScene(sceneManager.activeScene)
    },
    [sceneManager],
  )

  useScreenSocket({ screenId: SCREEN_ID, token: TOKEN, onMessage })

  return (
    <>
      <DmdCanvas config={config} scene={activeScene} />
      {import.meta.env.DEV && <DevOverlay config={config} onChange={setConfig} />}
    </>
  )
}

export default App
