import useBallStore from "@/stores/useBallStore"

const DEBUG_BALL_ID = "debug-ball"

export const getDebugBallId = (): string => {
  const { balls, playingBallIds } = useBallStore.getState()

  return playingBallIds[0] ?? balls[0]?.id ?? DEBUG_BALL_ID
}
