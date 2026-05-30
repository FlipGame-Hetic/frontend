import { useEffect } from "react"
import { broadcastEvent } from "@frontend/ws"
import { LEFT_KEYS, RIGHT_KEYS } from "@/components/flipperJoints/jointsConfig"

export const useFlipperButtonRelay = (): void => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (LEFT_KEYS.includes(e.code)) {
        broadcastEvent({ event_type: "FlipperLeft", payload: {} })
      } else if (RIGHT_KEYS.includes(e.code)) {
        broadcastEvent({ event_type: "FlipperRight", payload: {} })
      }
    }
    window.addEventListener("keydown", handler)
    return () => {
      window.removeEventListener("keydown", handler)
    }
  }, [])
}
