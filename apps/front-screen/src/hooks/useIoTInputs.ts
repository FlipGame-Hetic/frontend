import { useCallback } from "react"
import { useGameSocket } from "@frontend/ws"
import type { ButtonPayload, GameMessage, GyroPayload, PlungerPayload } from "@frontend/types"
import { pressKey, releaseKey } from "@/stores/inputStore"
import useGameStore from "@/stores/useGameStore"

/**
 * Maps ESP32 button IDs to keyboard codes used by the physics components.
 * Adjust these to match your hardware button wiring.
 */
const BUTTON_KEY_MAP: Record<string, string[]> = {
  left_flipper: ["ShiftLeft"],
  right_flipper: ["ShiftRight"],
}

export function useIoTInputs(): void {
  const setPhase = useGameStore((s) => s.setPhase)

  const onMessage = useCallback(
    (message: GameMessage) => {
      switch (message._type) {
        case "Button": {
          const { id, state } = message as GameMessage & ButtonPayload
          const keys = BUTTON_KEY_MAP[id] ?? []
          if (state === 1) {
            keys.forEach(pressKey)
          } else {
            keys.forEach(releaseKey)
          }
          break
        }

        case "Plunger": {
          const { released } = message as GameMessage & PlungerPayload
          if (released) {
            releaseKey("Space")
          } else {
            pressKey("Space")
          }
          break
        }

        case "Gyro": {
          const { tilt } = message as GameMessage & GyroPayload
          if (tilt) {
            setPhase("paused")
          }
          break
        }

        case "Status": {
          setPhase("waiting")
          break
        }

        default:
          break
      }
    },
    [setPhase],
  )

  useGameSocket({ onMessage })
}
