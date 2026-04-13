import type { BallState } from "@/types/ballTypes"
import type { PositionType } from "@/types/worldTypes"
import { create } from "zustand"

interface BallStore {
  balls: BallState[]
  playingBallIds: string[]
  rampingBallIds: string[]
  spawnBall: (position: PositionType) => void
  spawnBallWithVelocity: (position: PositionType, velocity: PositionType) => void
  deleteBall: (id: string) => void
  setBallPlaying: (id: string, isPlaying: boolean) => void
  setBallRamping: (id: string, isRamping: boolean) => void
}

const useBallStore = create<BallStore>()((set) => ({
  balls: [],
  playingBallIds: [],
  rampingBallIds: [],
  spawnBall: (position) => {
    const id = crypto.randomUUID()
    set((state) => ({
      balls: [...state.balls, { id, position }],
    }))
  },
  spawnBallWithVelocity: (position, velocity) => {
    const id = crypto.randomUUID()
    set((state) => ({
      balls: [...state.balls, { id, position, initialVelocity: velocity }],
    }))
  },
  deleteBall: (id) => {
    set((state) => ({
      balls: state.balls.filter((ball) => ball.id !== id),
      playingBallIds: state.playingBallIds.filter((playingBallId) => playingBallId !== id),
      rampingBallIds: state.rampingBallIds.filter((rampingBallId) => rampingBallId !== id),
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
  setBallRamping: (id, isRamping) => {
    set((state) => {
      const already = state.rampingBallIds.includes(id)
      if (isRamping) {
        return already ? state : { rampingBallIds: [...state.rampingBallIds, id] }
      }
      return { rampingBallIds: state.rampingBallIds.filter((rid) => rid !== id) }
    })
  },
}))

export default useBallStore
