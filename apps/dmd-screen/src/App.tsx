import { useCallback, useMemo, useState } from "react"
import { useScreenHub } from "@frontend/ws"
import { isScreenEvent } from "@frontend/types"
import type { ScreenEnvelope, GamePhase } from "@frontend/types"
import { DEFAULT_DMD_CONFIG } from "@/dmd/config"
import type { DmdConfig } from "@/dmd/config"
import { DmdCanvas } from "@/dmd/DmdCanvas"
import { ScoreScene } from "@/dmd/scenes/ScoreScene"
import { IdleScene } from "@/dmd/scenes/IdleScene"
import { PausedScene } from "@/dmd/scenes/PausedScene"
import { ModeSelectScene } from "@/dmd/scenes/ModeSelectScene"
import { CharacterSelectScene } from "@/dmd/scenes/CharacterSelectScene"
import { GameOverScene } from "@/dmd/scenes/GameOverScene"
import { DevOverlay as _DevOverlay } from "@/components/DevOverlay"

const SCREEN_ID = "dmd_screen" as const
const TOKEN =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SCREEN_TOKEN ?? ""

function App() {
  const [config, _setConfig] = useState<DmdConfig>(DEFAULT_DMD_CONFIG)
  const [phase, setPhase] = useState<GamePhase>("idle")

  const scenes = useMemo(
    () => ({
      idle: new IdleScene(),
      mode_select: new ModeSelectScene(),
      character_select: new CharacterSelectScene(),
      playing: new ScoreScene(),
      paused: new PausedScene(),
      game_over: new GameOverScene(),
    }),
    [],
  )

  const onEvent = useCallback(
    (envelope: ScreenEnvelope) => {
      if (isScreenEvent(envelope, "phase_change")) {
        scenes.playing.update({
          player: envelope.payload.player ?? 1,
          ballNumber: envelope.payload.ball ?? 1,
        })
        setPhase(envelope.payload.phase)
        return
      }

      if (isScreenEvent(envelope, "score_update")) {
        scenes.playing.update({
          score: envelope.payload.score,
          player: envelope.payload.player,
          ballNumber: envelope.payload.ball,
        })
        scenes.game_over.update(envelope.payload.score)
        return
      }

      if (isScreenEvent(envelope, "mode_selected")) {
        scenes.mode_select.update(envelope.payload.mode)
        return
      }

      if (isScreenEvent(envelope, "character_selected")) {
        scenes.character_select.update(envelope.payload.character)
        return
      }

      if (isScreenEvent(envelope, "life_update")) {
        scenes.playing.update({ player: envelope.payload.player })
      }
    },
    [scenes],
  )

  useScreenHub({ screenId: SCREEN_ID, token: TOKEN, onEvent })

  return (
    <>
      <DmdCanvas config={config} scene={scenes[phase]} />
      {/* {import.meta.env.DEV && <DevOverlay config={config} onChange={setConfig} />} */}
    </>
  )
}

export default App
