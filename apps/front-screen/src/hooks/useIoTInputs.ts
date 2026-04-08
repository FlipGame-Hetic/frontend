import { useCallback } from "react"
import { useGameSocket } from "@frontend/ws"
import type { ButtonPayload, GameMessage, GyroPayload, PlungerPayload } from "@frontend/types"
import { pressKey, releaseKey } from "@/stores/inputStore"
import { LEFT_KEYS, RIGHT_KEYS } from "@/components/flipperJoints/jointsConfig"
import { PLUNGER_KEY } from "@/components/plunger/plungerConfig"
import useGameStore from "@/stores/useGameStore"

const BUTTON_KEY_MAP: Record<string, string[]> = {
  left_flipper: LEFT_KEYS,
  right_flipper: RIGHT_KEYS,
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
            releaseKey(PLUNGER_KEY)
          } else {
            pressKey(PLUNGER_KEY)
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
