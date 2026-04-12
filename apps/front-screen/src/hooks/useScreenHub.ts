import { useEffect, useRef } from "react"
import { useScreenSocket } from "@frontend/ws"
import type { ScreenEnvelope } from "@frontend/types"
import useGameStore from "@/stores/useGameStore"

const SCREEN_ID = "front_screen" as const

const TOKEN =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SCREEN_TOKEN ?? ""

export function useScreenHub(): void {
  const { send } = useScreenSocket({
    screenId: SCREEN_ID,
    token: TOKEN,
    // TODO: traiter les enveloppes reçues (sync score, mises à jour depuis les autres écrans)
    onMessage: undefined,
  })

  const score = useGameStore((s) => s.score)
  const phase = useGameStore((s) => s.phase)
  const ballNumber = useGameStore((s) => s.ballNumber)
  const currentPlayer = useGameStore((s) => s.currentPlayer)

  const prevScore = useRef(score)
  const prevPhase = useRef(phase)

  useEffect(() => {
    if (score === prevScore.current) return
    prevScore.current = score

    const envelope: ScreenEnvelope = {
      from: SCREEN_ID,
      to: { kind: "broadcast" },
      event_type: "score_update",
      payload: { score, player: currentPlayer, ball: ballNumber },
    }
    send(envelope)
  }, [score, ballNumber, currentPlayer, send])

  useEffect(() => {
    if (phase === prevPhase.current) return
    prevPhase.current = phase

    const envelope: ScreenEnvelope = {
      from: SCREEN_ID,
      to: { kind: "broadcast" },
      event_type: "phase_change",
      payload: { phase, ball: ballNumber, player: currentPlayer },
    }
    send(envelope)
  }, [phase, ballNumber, currentPlayer, send])
}
