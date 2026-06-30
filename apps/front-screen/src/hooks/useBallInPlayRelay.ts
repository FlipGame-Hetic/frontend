import { useEffect } from "react"
import { broadcastEvent } from "@frontend/ws"
import useBallStore from "@/stores/useBallStore"

export const useBallInPlayRelay = (): void => {
  useEffect(() => {
    let previousInPlay = useBallStore.getState().playingBallIds.length > 0
    // Only broadcast the binary edge, intermediate ball-count changes keep the same in-play boolean
    return useBallStore.subscribe((state) => {
      const inPlay = state.playingBallIds.length > 0
      if (inPlay === previousInPlay) return
      previousInPlay = inPlay
      broadcastEvent({ event_type: "BallInPlay", payload: { in_play: inPlay } })
    })
  }, [])
}
