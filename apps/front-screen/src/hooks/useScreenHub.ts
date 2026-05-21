import { useEffect } from "react"
import { useScreenHub as useScreenHubBase, registerScreenSender } from "@frontend/ws"
import { isScreenEvent } from "@frontend/types"
import type { ScreenEnvelope } from "@frontend/types"
import useGameStore from "@/stores/useGameStore"

const SCREEN_ID = "front_screen" as const

const TOKEN =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SCREEN_TOKEN ?? ""

export function useScreenHub(): void {
  const { send } = useScreenHubBase({
    screenId: SCREEN_ID,
    token: TOKEN,
    onEvent: (envelope: ScreenEnvelope) => {
      const { selectMode, selectCharacter, startGame, setPhase, restartGame } =
        useGameStore.getState()

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
        startGame()
        return
      }
    },
  })

  useEffect(() => {
    registerScreenSender(SCREEN_ID, send)
  }, [send])

  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      if (state.phase !== prev.phase) {
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
