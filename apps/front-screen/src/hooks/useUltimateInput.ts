import { broadcastEvent } from "@frontend/ws"
import { GAME_PHASE } from "@frontend/types"
import useKeyBinding from "@/hooks/useKeyBinding"
import useGameStore from "@/stores/useGameStore"
import {
  getUltimateEventTypeForKey,
  ULTIMATE_INPUT_KEYS,
} from "@/components/ultimate/ultimateConfig"

export const useUltimateInput = (): void => {
  useKeyBinding(
    ULTIMATE_INPUT_KEYS,
    (e) => {
      const eventType = getUltimateEventTypeForKey(e.code)
      if (!eventType) return

      broadcastEvent({ event_type: eventType, payload: {} })
    },
    { when: () => useGameStore.getState().phase === GAME_PHASE.Playing },
  )
}
