import { useEffect } from "react"
import { broadcastEvent } from "@frontend/ws"
import useGameStore from "@/stores/useGameStore"

type UltimateInputEventType = "CapacityL2" | "CapacityR2"

const ULTIMATE_EVENT_BY_KEY: Partial<Record<string, UltimateInputEventType>> = {
  ArrowDown: "CapacityL2",
  ArrowUp: "CapacityR2",
}

export const useUltimateInput = (): void => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return
      const eventType = ULTIMATE_EVENT_BY_KEY[e.code]
      if (!eventType) return
      if (useGameStore.getState().phase !== "playing") return
      broadcastEvent({ event_type: eventType, payload: {} })
    }
    window.addEventListener("keydown", handler)
    return () => {
      window.removeEventListener("keydown", handler)
    }
  }, [])
}
