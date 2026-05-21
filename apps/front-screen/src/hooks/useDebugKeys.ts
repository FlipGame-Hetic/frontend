import { useEffect } from "react"
import { broadcastEvent } from "@frontend/ws"
import useGameStore from "@/stores/useGameStore"
import { BUMPER_SCORE } from "@/config/scoreConfig"

export function useDebugKeys(): void {
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const handler = (e: KeyboardEvent) => {
      const { addScore, nextBall, currentPlayer, ballNumber } = useGameStore.getState()

      switch (e.key.toLowerCase()) {
        case "b":
          broadcastEvent({ event_type: "bumper_hit", payload: { bumper_id: 0 } })
          addScore(BUMPER_SCORE)
          break
        case "l":
          broadcastEvent({
            event_type: "ball_lost",
            payload: { ball: ballNumber, player: currentPlayer },
          })
          nextBall()
          break
      }
    }

    window.addEventListener("keydown", handler)
    return () => {
      window.removeEventListener("keydown", handler)
    }
  }, [])
}
