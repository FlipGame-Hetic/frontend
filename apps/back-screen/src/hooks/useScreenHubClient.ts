import { useEffect } from "react"
import { useScreenHub, registerScreenSender, fetchGameState } from "@frontend/ws"
import { readScreenToken } from "@frontend/utils"
import { isScreenEvent, mapEnginePhaseToGamePhase, GAME_PHASE } from "@frontend/types"
import type { ConnectionStatus, ScreenEnvelope } from "@frontend/types"
import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { fetchLeaderboard } from "@/api/leaderboard"
import { handleMenuButton } from "@/menu/menuActions"

const SCREEN_ID = "back_screen" as const
const TOKEN = readScreenToken()

export function useScreenHubClient(): ConnectionStatus {
  const setPhase = useBackScreenStore((s) => s.setPhase)
  const setScore = useBackScreenStore((s) => s.setScore)
  const setBallNumber = useBackScreenStore((s) => s.setBallNumber)
  const setBoss = useBackScreenStore((s) => s.setBoss)
  const markBossDefeated = useBackScreenStore((s) => s.markBossDefeated)
  const clearBoss = useBackScreenStore((s) => s.clearBoss)
  const setLeaderboard = useBackScreenStore((s) => s.setLeaderboard)

  const { send, status } = useScreenHub({
    screenId: SCREEN_ID,
    token: TOKEN,
    onEvent: (envelope: ScreenEnvelope) => {
      if (isScreenEvent(envelope, "MenuButton")) {
        handleMenuButton(envelope.payload.id, envelope.payload.state)
        return
      }
      if (isScreenEvent(envelope, "phase_change")) {
        setPhase(envelope.payload.phase)
        if (envelope.payload.score !== undefined) setScore(envelope.payload.score)
        if (envelope.payload.ball !== undefined) setBallNumber(envelope.payload.ball)
        return
      }
      if (isScreenEvent(envelope, "ScoreUpdate")) {
        setScore(envelope.payload.score)
        if (envelope.payload.ball !== undefined) setBallNumber(envelope.payload.ball)
        return
      }
      if (isScreenEvent(envelope, "GameOver")) {
        setScore(envelope.payload.final_score)
        setPhase(GAME_PHASE.GameOver)
        return
      }
      if (isScreenEvent(envelope, "BossUpdate")) {
        const { boss_id, boss_hp, boss_max_hp } = envelope.payload
        setBoss({ bossId: boss_id, bossHp: boss_hp, bossMaxHp: boss_max_hp })
        return
      }
      if (isScreenEvent(envelope, "BossDefeated")) {
        markBossDefeated()
        return
      }
      if (isScreenEvent(envelope, "BossCleared")) {
        clearBoss()
        return
      }
      if (isScreenEvent(envelope, "LeaderboardUpdate")) {
        setLeaderboard(envelope.payload)
      }
    },
  })

  useEffect(() => {
    registerScreenSender(SCREEN_ID, send)
  }, [send])

  useEffect(() => {
    void fetchLeaderboard().then(setLeaderboard)
  }, [setLeaderboard])

  useEffect(() => {
    if (status !== "connected") return
    void fetchGameState().then((snapshot) => {
      if (!snapshot) return
      setScore(snapshot.score)
      setPhase(mapEnginePhaseToGamePhase(snapshot.phase))
    })
    void fetchLeaderboard().then(setLeaderboard)
  }, [status, setScore, setPhase, setLeaderboard])

  return status
}
