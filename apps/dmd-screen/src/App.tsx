import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useScreenHub } from "@frontend/ws"
import { isScreenEvent } from "@frontend/types"
import type { ComboDirection, ScreenEnvelope, GamePhase } from "@frontend/types"
import { DEFAULT_DMD_CONFIG } from "@/dmd/config"
import type { DmdConfig } from "@/dmd/config"
import { DmdCanvas } from "@/dmd/DmdCanvas"
import { ScoreScene } from "@/dmd/scenes/ScoreScene"
import { IdleScene } from "@/dmd/scenes/IdleScene"
import { PausedScene } from "@/dmd/scenes/PausedScene"
import { ModeSelectScene } from "@/dmd/scenes/ModeSelectScene"
import { CharacterSelectScene } from "@/dmd/scenes/CharacterSelectScene"
import { GameOverScene } from "@/dmd/scenes/GameOverScene"
import { ComboScene } from "@/dmd/scenes/ComboScene"
import { DevOverlay } from "@/components/DevOverlay"

const SCREEN_ID = "dmd_screen" as const
const TOKEN =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SCREEN_TOKEN ?? ""

const COMBO_FLASH_MS = 1800

const isComboDirection = (value: unknown): value is ComboDirection => value === "L" || value === "R"

const parseComboSequence = (value: unknown): ComboDirection[] | undefined => {
  if (!Array.isArray(value) || value.length === 0) return undefined
  return value.every(isComboDirection) ? value : undefined
}

function App() {
  const [config, setConfig] = useState<DmdConfig>(DEFAULT_DMD_CONFIG)
  const [phase, setPhase] = useState<GamePhase>("idle")
  const [devPhase, setDevPhase] = useState<GamePhase | null>(null)
  const [comboActive, setComboActive] = useState(false)
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalBallsRef = useRef(0)

  const scenes = useMemo(
    () => ({
      idle: new IdleScene(),
      mode_select: new ModeSelectScene(),
      character_select: new CharacterSelectScene(),
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

  const onEvent = useCallback(
    (envelope: ScreenEnvelope) => {
      if (isScreenEvent(envelope, "phase_change")) {
        if (envelope.payload.phase === "playing") {
          totalBallsRef.current = 0
        }
        scenes.playing.update({
          player: envelope.payload.player ?? 1,
          ballNumber: envelope.payload.ball ?? 1,
        })
        setPhase(envelope.payload.phase)
        return
      }

      if (isScreenEvent(envelope, "ScoreUpdate")) {
        const score = envelope.payload.score
        const ball = envelope.payload.ball ?? 1
        const player = envelope.payload.player !== undefined ? Number(envelope.payload.player) : 1
        const multiplier = envelope.payload.multiplier ?? 1
        scenes.playing.update({ score, player, ballNumber: ball, multiplier })
        scenes.game_over.update(score)
        return
      }

      if (isScreenEvent(envelope, "ComboActivated")) {
        const { multiplier, duration_ms, sequence } = envelope.payload
        const comboSequence = parseComboSequence(sequence)
        if (multiplier !== undefined && duration_ms !== undefined) {
          scenes.playing.update({
            multiplier,
            multiplierDurationMs: duration_ms,
            multiplierStartedAt: performance.now(),
          })
        }
        scenes.combo.update({ sequence: comboSequence })
        if (comboTimerRef.current !== null) clearTimeout(comboTimerRef.current)
        setComboActive(true)
        comboTimerRef.current = setTimeout(() => {
          setComboActive(false)
          comboTimerRef.current = null
        }, COMBO_FLASH_MS)
        return
      }

      if (isScreenEvent(envelope, "MultiplierUpdate")) {
        const { multiplier, duration_ms } = envelope.payload
        scenes.playing.update({
          multiplier,
          multiplierDurationMs: duration_ms ?? 0,
          multiplierStartedAt: duration_ms !== undefined ? performance.now() : 0,
        })
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

      if (isScreenEvent(envelope, "LifeUpdate")) {
        const lives = envelope.payload.lives_remaining
        if (lives > totalBallsRef.current) totalBallsRef.current = lives
        scenes.playing.update({ lives, maxLives: totalBallsRef.current })
      }
    },
    [scenes],
  )

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
