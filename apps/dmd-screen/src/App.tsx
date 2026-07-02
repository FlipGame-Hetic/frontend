import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useScreenHub, registerScreenSender, sendEventTo } from "@frontend/ws"
import { readScreenToken } from "@frontend/utils"
import { ConnectionOverlay, useDebugOverlayStore } from "@frontend/ui"
import { GAME_PHASE } from "@frontend/types"
import type { ScreenEnvelope, GamePhase } from "@frontend/types"
import { Leva } from "leva"
import { DmdCanvas } from "@/dmd/DmdCanvas"
import { useDmdDevControls } from "@/dmd/useDmdDevControls"
import { ScoreScene } from "@/dmd/scenes/ScoreScene"
import { IdleScene } from "@/dmd/scenes/IdleScene"
import { PausedScene } from "@/dmd/scenes/PausedScene"
import { PreGameScene } from "@/dmd/scenes/PreGameScene"
import { GameOverScene } from "@/dmd/scenes/GameOverScene"
import { ComboScene } from "@/dmd/scenes/ComboScene"
import { ScreenEventRouter } from "@/dmd/sceneRouter"

const SCREEN_ID = "dmd_screen" as const
const TOKEN = readScreenToken()

const COMBO_FLASH_MS = 1800

function App() {
  const { config, devPhase } = useDmdDevControls()
  const overlayShown = useDebugOverlayStore((state) => state.visible)
  const [phase, setPhase] = useState<GamePhase>(GAME_PHASE.Idle)
  const [comboActive, setComboActive] = useState(false)
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scenes = useMemo(() => {
    // The two select phases both route to one pre-game scene — players look at the
    // backglass while choosing, so the DMD just runs a synthwave loop.
    const preGame = new PreGameScene()
    return {
      idle: new IdleScene(),
      mode_select: preGame,
      character_select: preGame,
      playing: new ScoreScene(),
      paused: new PausedScene(),
      game_over: new GameOverScene(),
      combo: new ComboScene(),
    }
  }, [])

  useEffect(() => {
    return () => {
      if (comboTimerRef.current !== null) clearTimeout(comboTimerRef.current)
    }
  }, [])

  // Flash the combo overlay for a fixed window, then return to the score scene.
  const triggerComboFlash = useCallback(() => {
    if (comboTimerRef.current !== null) clearTimeout(comboTimerRef.current)
    setComboActive(true)
    comboTimerRef.current = setTimeout(() => {
      setComboActive(false)
      comboTimerRef.current = null
    }, COMBO_FLASH_MS)
  }, [])

  // Build the router once (deps are stable). Constructed in an effect so the
  // ref-backed timer callback is never read during render.
  const routerRef = useRef<ScreenEventRouter | null>(null)
  useEffect(() => {
    routerRef.current = new ScreenEventRouter(scenes, {
      onPhaseChange: setPhase,
      onComboFlash: triggerComboFlash,
    })
  }, [scenes, triggerComboFlash])

  const onEvent = useCallback((envelope: ScreenEnvelope) => {
    routerRef.current?.handle(envelope)
  }, [])

  const { status, send } = useScreenHub({ screenId: SCREEN_ID, token: TOKEN, onEvent })

  useEffect(() => {
    registerScreenSender(SCREEN_ID, send)
  }, [send])

  useEffect(() => {
    if (status !== "connected") return
    sendEventTo("front_screen", { event_type: "request_resync", payload: {} })
  }, [status])

  const effectivePhase = devPhase ?? phase
  const activeScene =
    comboActive && effectivePhase === GAME_PHASE.Playing ? scenes.combo : scenes[effectivePhase]

  return (
    <>
      <DmdCanvas config={config} scene={activeScene} transitionKey={effectivePhase} />
      <ConnectionOverlay status={status} />
      <Leva hidden={!overlayShown} titleBar={{ title: "DMD Dev" }} />
    </>
  )
}

export default App
