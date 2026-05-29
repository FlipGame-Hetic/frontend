import { useEffect } from "react"
import { registerScreenSender, sendEventTo, useScreenHub as useScreenHubBase } from "@frontend/ws"
import { isScreenEvent, makeEnvelope } from "@frontend/types"
import type {
  CharacterType,
  GameMode,
  ScreenEnvelope,
  ScreenEvent,
  StartGameEvent,
} from "@frontend/types"
import useGameStore from "@/stores/useGameStore"

const SCREEN_ID = "front_screen" as const
const DEFAULT_START_MODE: GameMode = "solo"
const DEFAULT_START_CHARACTER: CharacterType = "striker"

const TOKEN =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SCREEN_TOKEN ?? ""

const handleScreenEvent = (envelope: ScreenEnvelope): void => {
  const { selectMode, selectCharacter, startGame, setPhase, restartGame } = useGameStore.getState()

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

export const dispatchFrontScreenEvent = (event: ScreenEvent): void => {
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
      if (
        state.phase !== prev.phase ||
        state.ballNumber !== prev.ballNumber ||
        state.currentPlayer !== prev.currentPlayer
      ) {
        send({
          from: SCREEN_ID,
          to: { kind: "broadcast" },
          event_type: "phase_change",
          payload: { phase: state.phase, ball: state.ballNumber, player: state.currentPlayer },
        })
      }
      if (state.score !== prev.score) {
        send({
          from: SCREEN_ID,
          to: { kind: "broadcast" },
          event_type: "score_update",
          payload: { score: state.score, player: state.currentPlayer, ball: state.ballNumber },
        })
      }
    })
    return unsub
  }, [send])
}
