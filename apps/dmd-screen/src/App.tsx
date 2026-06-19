import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useScreenHub } from "@frontend/ws"
import type { ScreenEnvelope, GamePhase } from "@frontend/types"
import { DEFAULT_DMD_CONFIG } from "@/dmd/config"
import type { DmdConfig } from "@/dmd/config"
import { DmdCanvas } from "@/dmd/DmdCanvas"
import { ScoreScene } from "@/dmd/scenes/ScoreScene"
import { IdleScene } from "@/dmd/scenes/IdleScene"
import { PausedScene } from "@/dmd/scenes/PausedScene"
import { SelectScene } from "@/dmd/scenes/SelectScene"
import { GameOverScene } from "@/dmd/scenes/GameOverScene"
import { ComboScene } from "@/dmd/scenes/ComboScene"
import { ScreenEventRouter } from "@/dmd/sceneRouter"
import { DevOverlay } from "@/components/DevOverlay"

const SCREEN_ID = "dmd_screen" as const
const TOKEN =
  (globalThis as unknown as Record<string, Record<string, string> | undefined>).__ENV__
    ?.VITE_SCREEN_TOKEN ??
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SCREEN_TOKEN ??
  ""

const COMBO_FLASH_MS = 1800
const MODE_BLINK_MS = 600
const CHARACTER_BLINK_MS = 500

function App() {
  const [config, setConfig] = useState<DmdConfig>(DEFAULT_DMD_CONFIG)
  const [phase, setPhase] = useState<GamePhase>("idle")
  const [devPhase, setDevPhase] = useState<GamePhase | null>(null)
  const [comboActive, setComboActive] = useState(false)
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scenes = useMemo(
    () => ({
      idle: new IdleScene(),
      mode_select: new SelectScene("SELECT MODE", MODE_BLINK_MS),
      character_select: new SelectScene("PICK FIGHTER", CHARACTER_BLINK_MS),
      playing: new ScoreScene(),
      paused: new PausedScene(),
      game_over: new GameOverScene(),
      combo: new ComboScene(),
    }),
    [],
  )

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

  useScreenHub({ screenId: SCREEN_ID, token: TOKEN, onEvent })

  const effectivePhase = devPhase ?? phase
  const activeScene =
    comboActive && effectivePhase === "playing" ? scenes.combo : scenes[effectivePhase]

  return (
    <>
      <DmdCanvas config={config} scene={activeScene} />
      {import.meta.env.DEV && (
        <DevOverlay
          config={config}
          onChange={setConfig}
          phase={effectivePhase}
          onPhaseChange={setDevPhase}
        />
      )}
    </>
  )
}

export default App
