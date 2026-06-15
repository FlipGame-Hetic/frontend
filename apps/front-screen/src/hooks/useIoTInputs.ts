import { useCallback } from "react"
import { useGameSocket } from "@frontend/ws"
import {
  BUTTON_IDS,
  type ButtonPayload,
  type GameMessage,
  type GyroPayload,
  type PlungerPayload,
} from "@frontend/types"
import { pressKey, releaseKey, setPlungerPosition, setPlungerReleased } from "@/stores/inputStore"
import { LEFT_KEYS, RIGHT_KEYS } from "@/components/flipperJoints/jointsConfig"
import { PLUNGER_KEY } from "@/components/plunger/plungerConfig"
import { applyNudge } from "@/physics/tilt"
import { triggerUltimate } from "@/gameplay/ultimate"
import useGameStore from "@/stores/useGameStore"

const BUTTON_KEY_MAP: Record<string, string[]> = {
  [BUTTON_IDS.flipperLeft]: LEFT_KEYS,
  [BUTTON_IDS.flipperRight]: RIGHT_KEYS,
}

export const useIoTInputs = (): void => {
  const setPhase = useGameStore((s) => s.setPhase)

  const onMessage = useCallback(
    (message: GameMessage) => {
      switch (message._type) {
        case "Button": {
          const { id, state } = message as GameMessage & ButtonPayload
          const phase = useGameStore.getState().phase

          const keys = BUTTON_KEY_MAP[id]
          if (keys) {
            if (state === 1) keys.forEach(pressKey)
            else keys.forEach(releaseKey)
            break
          }

          if (state !== 1) break

          if (id === BUTTON_IDS.start) {
            if (phase === "playing") useGameStore.getState().pause()
            else if (phase === "paused") useGameStore.getState().resume()
            break
          }

          if (id === BUTTON_IDS.extra1 || id === BUTTON_IDS.extra2) {
            if (phase === "playing") triggerUltimate(useGameStore.getState().currentPlayer)
          }
          break
        }

        case "Plunger": {
          const { position, released } = message as GameMessage & PlungerPayload
          setPlungerPosition(position)
          setPlungerReleased(released)
          if (!released) {
            pressKey(PLUNGER_KEY)
          } else {
            releaseKey(PLUNGER_KEY)
          }
          break
        }

        case "Gyro": {
          const { ax, ay, tilt } = message as GameMessage & GyroPayload
          if (tilt && useGameStore.getState().phase === "playing") {
            applyNudge(ax, ay)
          }
          break
        }

        case "Status": {
          setPhase("idle")
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
