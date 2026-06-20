import { useEffect } from "react"
import { broadcastEvent } from "@frontend/ws"
import useGameStore from "@/stores/useGameStore"

export const useDebugKeys = (): void => {
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return

      const { nextBall } = useGameStore.getState()

      switch (e.key.toLowerCase()) {
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
