import { LEFT_KEYS, RIGHT_KEYS } from "@/components/flippers/flipperConfig"
import { PLUNGER_KEY } from "@/components/plunger/plungerConfig"
import { setMusicSuspended } from "@/audio/soundEngine"
import { pressKey, releaseKey, triggerPlungerMaxLaunch } from "@/input/inputState"
import useGameStore from "@/stores/useGameStore"
import usePlayfieldReadyStore from "@/stores/usePlayfieldReadyStore"
import useScorePopupsStore from "@/stores/useScorePopupsStore"
import useUltimateStore from "@/stores/useUltimateStore"
import type {
  ConnectionStatus,
  GameMode,
  ScreenEnvelope,
  ScreenEvent,
  StartGameEvent,
} from "@frontend/types"
import { DEFAULT_CHARACTER, GAME_PHASE, makeEnvelope } from "@frontend/types"
import { readScreenToken } from "@frontend/utils"
import {
  broadcastEvent,
  fetchGameState,
  registerScreenSender,
  sendEventTo,
  useScreenHub as useScreenHubBase,
} from "@frontend/ws"
import { useEffect } from "react"

const SCREEN_ID = "front_screen" as const
const DEFAULT_START_MODE: GameMode = "solo"

const TOKEN = readScreenToken()

let cabinetPlungerHeld = false

const applyKeysState = (keys: string[], state: number): void => {
  const apply = state > 0 ? pressKey : releaseKey
  keys.forEach(apply)
}

type ScreenEventType = ScreenEvent["event_type"]
// Uses the extract to find the payload of a specified ScreenEvent
type PayloadFor<K extends ScreenEventType> = Extract<ScreenEvent, { event_type: K }>["payload"]

type ScreenEventHandler<K extends ScreenEventType> = (payload: PayloadFor<K>) => void
// Optional handler per event type, which receives that event's payload
type ScreenEventHandlers = { [K in ScreenEventType]?: ScreenEventHandler<K> }

const handlers: ScreenEventHandlers = {
  FlipperLeft: (payload) => {
    applyKeysState(LEFT_KEYS, payload.state)
  },

  FlipperRight: (payload) => {
    applyKeysState(RIGHT_KEYS, payload.state)
  },

  PlungerCharge: (payload) => {
    if (payload.state > 0) {
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
  },

  ScoreUpdate: (payload) => {
    const { score, ultimate_charge, ultimate_max, ulti_ready, next_ulti_id } = payload
    useGameStore.getState().setScore(score)
    useUltimateStore.getState().setChargeFromScore({
      ultimate_charge,
      ultimate_max,
      ulti_ready,
      next_ulti_id,
    })
  },

  UltimateTriggered: (payload) => {
    useUltimateStore.getState().onTriggered(payload)
  },

  UltimateStopped: (payload) => {
    useUltimateStore.getState().onStopped(payload)
  },

  ScoreDelta: (payload) => {
    if (payload.reason !== "timer_bonus") {
      useScorePopupsStore
        .getState()
        .spawnPopupFromDelta(payload.delta, payload.reason, payload.ball_id)
    }
    useGameStore.getState().setScore(payload.total)
  },

  GameOver: (payload) => {
    const { setScore, endGame } = useGameStore.getState()
    setScore(payload.final_score)
    endGame()
  },

  request_resync: () => {
    const { phase, score, ballNumber, currentPlayer } = useGameStore.getState()
    broadcastEvent({
      event_type: "phase_change",
      payload: { phase, ball: ballNumber, player: currentPlayer, score },
    })
    broadcastEvent({
      event_type: "ScoreUpdate",
      payload: { score, player: currentPlayer, ball: ballNumber },
    })
  },

  menu_back: () => {
    useGameStore.getState().menuBack()
  },

  playfield_music: (payload) => {
    setMusicSuspended(!payload.playing)
  },

  menu_confirm: (payload) => {
    const { setPhase, restartGame } = useGameStore.getState()
    if (payload.context === GAME_PHASE.Idle) setPhase(GAME_PHASE.ModeSelect)
    if (payload.context === GAME_PHASE.GameOver) restartGame()
  },

  mode_selected: (payload) => {
    useGameStore.getState().selectMode(payload.mode)
  },

  character_selected: (payload) => {
    useGameStore.getState().selectCharacter(payload.player, payload.character)
  },

  start_game: (payload) => {
    useGameStore.getState().startGame(payload)
    const player = payload.players[0]
    if (player) {
      broadcastEvent({
        event_type: "StartGame",
        payload: {
          player_id: String(player.player),
          character: player.character,
        },
      })
    }
  },
}

const handleScreenEvent = (envelope: ScreenEnvelope): void => {
  // event_type is a runtime string, so we cast it to the key union to index the map; the second cast loosens the result to a plain (payload) => void because the per-key payload link can't survive a dynamic lookup.
  const handler = handlers[envelope.event_type as ScreenEventType] as
    | ((payload: unknown) => void)
    | undefined
  handler?.(envelope.payload)
}

const getStartGamePayload = (): StartGameEvent["payload"] => {
  const { mode, selectedPlayers } = useGameStore.getState()

  return {
    mode: mode ?? DEFAULT_START_MODE,
    players:
      selectedPlayers.length > 0
        ? selectedPlayers.map((player) => ({ ...player }))
        : [{ player: 1, character: DEFAULT_CHARACTER.id }],
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

export const useScreenHub = (): ConnectionStatus => {
  const { send, status } = useScreenHubBase({
    screenId: SCREEN_ID,
    token: TOKEN,
    onEvent: handleScreenEvent,
  })

  useEffect(() => {
    registerScreenSender(SCREEN_ID, send)
  }, [send])

  const playfieldReady = usePlayfieldReadyStore((s) => s.ready)

  useEffect(() => {
    if (status !== "connected" || !playfieldReady) return
    void fetchGameState().then((snapshot) => {
      if (snapshot?.phase !== "in_game") return
      if (useGameStore.getState().phase === GAME_PHASE.Playing) return
      useGameStore.getState().resumeGame(snapshot.score, snapshot.character ?? undefined)
    })
  }, [status, playfieldReady])

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

  return status
}
