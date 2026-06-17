import { useEffect } from "react"
import {
  broadcastEvent,
  registerScreenSender,
  sendEventTo,
  useScreenHub as useScreenHubBase,
  wsLog,
} from "@frontend/ws"
import { isScreenEvent, makeEnvelope } from "@frontend/types"
import type {
  CharacterType,
  GameMode,
  ScreenEnvelope,
  ScreenEvent,
  StartGameEvent,
} from "@frontend/types"
import { LEFT_KEYS, RIGHT_KEYS } from "@/components/flipperJoints/jointsConfig"
import { PLUNGER_KEY } from "@/components/plunger/plungerConfig"
import { triggerUltimate } from "@/gameplay/ultimate"
import { pressKey, releaseKey, triggerPlungerMaxLaunch } from "@/stores/inputStore"
import useGameStore, { CHARACTER_ID_BY_TYPE } from "@/stores/useGameStore"
import useScorePopupsStore from "@/stores/useScorePopupsStore"

const SCREEN_ID = "front_screen" as const
const DEFAULT_START_MODE: GameMode = "solo"
const DEFAULT_START_CHARACTER: CharacterType = "striker"

const TOKEN =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SCREEN_TOKEN ?? ""

let cabinetPlungerHeld = false

const applyKeysState = (keys: string[], state: number): void => {
  const apply = state > 0 ? pressKey : releaseKey
  keys.forEach(apply)
}

const handleScreenEvent = (envelope: ScreenEnvelope): void => {
  wsLog("front-screen", `handleScreenEvent "${envelope.event_type}"`, envelope)

  const { selectMode, selectCharacter, startGame, setPhase, restartGame, setScore, menuBack } =
    useGameStore.getState()

  if (isScreenEvent(envelope, "FlipperLeft")) {
    applyKeysState(LEFT_KEYS, envelope.payload.state)
    return
  }

  if (isScreenEvent(envelope, "FlipperRight")) {
    applyKeysState(RIGHT_KEYS, envelope.payload.state)
    return
  }

  if (isScreenEvent(envelope, "PlungerCharge")) {
    if (envelope.payload.state > 0) {
      cabinetPlungerHeld = true
      pressKey(PLUNGER_KEY)
      return
    }

    if (cabinetPlungerHeld) {
      cabinetPlungerHeld = false
      releaseKey(PLUNGER_KEY)
      return
    }

    triggerPlungerMaxLaunch()
    return
  }

  if (isScreenEvent(envelope, "CapacityL2") || isScreenEvent(envelope, "CapacityR2")) {
    triggerUltimate(useGameStore.getState().currentPlayer)
    return
  }

  if (envelope.event_type === "ScoreUpdate") {
    const payload = envelope.payload as { score: number }
    setScore(payload.score)
    return
  }

  if (envelope.event_type === "ScoreDelta") {
    const payload = envelope.payload as {
      delta: number
      reason: string
      total: number
      ball_id?: string
    }
    if (payload.reason !== "timer_bonus") {
      useScorePopupsStore
        .getState()
        .spawnPopupFromDelta(payload.delta, payload.reason, payload.ball_id)
    }
    setScore(payload.total)
    return
  }

  if (isScreenEvent(envelope, "menu_back")) {
    menuBack()
    return
  }
  if (isScreenEvent(envelope, "menu_confirm")) {
    if (envelope.payload.context === "idle") setPhase("mode_select")
    if (envelope.payload.context === "game_over") restartGame()
    return
  }
  if (isScreenEvent(envelope, "mode_selected")) {
    selectMode(envelope.payload.mode)
    return
  }
  if (isScreenEvent(envelope, "character_selected")) {
    selectCharacter(envelope.payload.player, envelope.payload.character)
    return
  }
  if (isScreenEvent(envelope, "start_game")) {
    startGame(envelope.payload)
    const player = envelope.payload.players[0]
    if (player) {
      broadcastEvent({
        event_type: "StartGame",
        payload: {
          player_id: String(player.player),
          character_id: CHARACTER_ID_BY_TYPE[player.character],
        },
      })
    }
  }
}

const getStartGamePayload = (): StartGameEvent["payload"] => {
  const { mode, selectedPlayers } = useGameStore.getState()

  return {
    mode: mode ?? DEFAULT_START_MODE,
    players:
      selectedPlayers.length > 0
        ? selectedPlayers.map((player) => ({ ...player }))
        : [{ player: 1, character: DEFAULT_START_CHARACTER }],
  }
}

const dispatchFrontScreenEvent = (event: ScreenEvent): void => {
  sendEventTo(SCREEN_ID, event)
  handleScreenEvent(makeEnvelope(SCREEN_ID, { kind: "screen", id: SCREEN_ID }, event))
}

export const requestFrontScreenStartGame = (): void => {
  dispatchFrontScreenEvent({
    event_type: "start_game",
    payload: getStartGamePayload(),
  })
}

export const useScreenHub = (): void => {
  const { send } = useScreenHubBase({
    screenId: SCREEN_ID,
    token: TOKEN,
    onEvent: handleScreenEvent,
  })

  useEffect(() => {
    registerScreenSender(SCREEN_ID, send)
  }, [send])

  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      if (state.score !== prev.score) {
        send({
          from: SCREEN_ID,
          to: { kind: "broadcast" },
          event_type: "ScoreUpdate",
          payload: {
            score: state.score,
            player: state.currentPlayer,
            ball: state.ballNumber,
          },
        })
      }

      if (
        state.phase !== prev.phase ||
        state.ballNumber !== prev.ballNumber ||
        state.currentPlayer !== prev.currentPlayer
      ) {
        send({
          from: SCREEN_ID,
          to: { kind: "broadcast" },
          event_type: "phase_change",
          payload: {
            phase: state.phase,
            ball: state.ballNumber,
            player: state.currentPlayer,
            score: state.score,
          },
        })
      }
    })
    return unsub
  }, [send])
}
