import { useEffect } from "react"
import { useScreenHub, registerScreenSender } from "@frontend/ws"
import { isScreenEvent } from "@frontend/types"
import type { ScreenEnvelope } from "@frontend/types"
import { useBackScreenStore } from "@/stores/useBackScreenStore"

const SCREEN_ID = "back_screen" as const
const TOKEN =
  (globalThis as Record<string, Record<string, string> | undefined>).__ENV__?.VITE_SCREEN_TOKEN ??
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SCREEN_TOKEN ??
  ""

export function useScreenHubClient(): void {
  const setPhase = useBackScreenStore((s) => s.setPhase)
  const setScore = useBackScreenStore((s) => s.setScore)
  const setBallNumber = useBackScreenStore((s) => s.setBallNumber)

  const { send } = useScreenHub({
    screenId: SCREEN_ID,
    token: TOKEN,
    onEvent: (envelope: ScreenEnvelope) => {
      if (isScreenEvent(envelope, "phase_change")) {
        setPhase(envelope.payload.phase)
        if (envelope.payload.score !== undefined) setScore(envelope.payload.score)
        if (envelope.payload.ball !== undefined) setBallNumber(envelope.payload.ball)
        return
      }
      if (isScreenEvent(envelope, "ScoreUpdate")) {
        setScore(envelope.payload.score)
        if (envelope.payload.ball !== undefined) setBallNumber(envelope.payload.ball)
      }
    },
  })

  useEffect(() => {
    registerScreenSender(SCREEN_ID, send)
  }, [send])
}
