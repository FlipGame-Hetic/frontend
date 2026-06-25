import { broadcastEvent } from "@frontend/ws"
import { LEFT_KEYS, RIGHT_KEYS } from "@/components/flippers/flipperConfig"
import useKeyBinding from "@/hooks/useKeyBinding"
import useBallStore from "@/stores/useBallStore"

export const useFlipperButtonRelay = (): void => {
  // Only relay flipper presses while a ball is in play, so menu/idle button press are not sent to the cabinet
  const when = () => useBallStore.getState().playingBallIds.length > 0

  useKeyBinding(
    LEFT_KEYS,
    () => {
      broadcastEvent({ event_type: "FlipperLeft", payload: { state: 1 } })
    },
    { when },
  )

  useKeyBinding(
    RIGHT_KEYS,
    () => {
      broadcastEvent({ event_type: "FlipperRight", payload: { state: 1 } })
    },
    { when },
  )
}
