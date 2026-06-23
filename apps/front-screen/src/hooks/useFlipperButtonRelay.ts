import { broadcastEvent } from "@frontend/ws"
import { LEFT_KEYS, RIGHT_KEYS } from "@/components/flipperJoints/jointsConfig"
import useKeyBinding from "@/hooks/useKeyBinding"
import useBallStore from "@/stores/useBallStore"

export const useFlipperButtonRelay = (): void => {
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
