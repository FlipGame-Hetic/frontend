import type { BallState } from "@/types/ballTypes"
import type { PositionType } from "@/types/worldTypes"
import { create } from "zustand"

interface BallStore {
  balls: BallState[]
  playingBallIds: string[]
  spawnBall: (position: PositionType) => void
  deleteBall: (id: string) => void
  setBallPlaying: (id: string, isPlaying: boolean) => void
}

const useBallStore = create<BallStore>()((set) => ({
  balls: [],
  playingBallIds: [],
  spawnBall: (position) => {
    const id = crypto.randomUUID()
    set((state) => ({
      balls: [...state.balls, { id, position }],
    }))
  },
  deleteBall: (id) => {
    set((state) => ({
      balls: state.balls.filter((ball) => ball.id !== id),
      playingBallIds: state.playingBallIds.filter((playingBallId) => playingBallId !== id),
    }))
  },
  setBallPlaying: (id, isPlaying) => {
    set((state) => {
      const isAlreadyPlaying = state.playingBallIds.includes(id)

      if (isPlaying) {
        if (isAlreadyPlaying) {
          return state
        }

        return {
          playingBallIds: [...state.playingBallIds, id],
        }
      }

      if (!isAlreadyPlaying) {
        return state
      }

      return {
        playingBallIds: state.playingBallIds.filter((playingBallId) => playingBallId !== id),
      }
    })
  },
}))

export default useBallStore
