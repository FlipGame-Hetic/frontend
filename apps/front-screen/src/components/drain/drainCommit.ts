import useGameStore from "@/stores/useGameStore"
import useBallStore from "@/stores/useBallStore"
import { playRandomSfx } from "@/audio/soundEngine"
import { broadcastEvent } from "@frontend/ws"

// Single source of truth for committing a lost ball
export const commitBallDrain = (ballId: string, respawnDelayMs: number): void => {
  const { isFinalBall, nextBall } = useGameStore.getState()
  const drainResult = useBallStore.getState().drainBall(ballId)
  // Duplicate hit for an already-removed ball, nothing to drain
  if (!drainResult.wasTracked) return

  playRandomSfx("ball_lost")

  // Mid-multiball drain : this ball is gone but others remain, so no life is lost and we stop here
  if (!drainResult.isLifeLost) return

  broadcastEvent({ event_type: "BallLost", payload: {} })

  // If it was the final ball, nextBall ends the game immediately, otherwise wait respawnDelay before serving the next ball
  if (isFinalBall()) {
    nextBall()
    return
  }

  setTimeout(() => {
    useGameStore.getState().nextBall()
  }, respawnDelayMs)
}
