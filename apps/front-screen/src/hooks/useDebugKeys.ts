import { useEffect } from "react"
import { broadcastEvent } from "@frontend/ws"
import { getDebugBallId } from "@/debug/getDebugBallId"
import useGameStore from "@/stores/useGameStore"

export const useDebugKeys = (): void => {
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const handler = (e: KeyboardEvent) => {
      const { nextBall } = useGameStore.getState()

      switch (e.key.toLowerCase()) {
        case "b":
          broadcastEvent({ event_type: "Bumper", payload: { ball_id: getDebugBallId() } })
          break
        case "k":
          broadcastEvent({ event_type: "BallLost", payload: {} })
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
