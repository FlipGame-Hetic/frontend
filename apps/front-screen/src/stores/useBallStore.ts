import type { BallState } from "@/types/ballTypes"
import type { PositionType } from "@/types/worldTypes"
import { playSfx } from "@/audio/soundEngine"
import { resetTilt } from "@/physics/tilt"
import { create } from "zustand"

interface BallStore {
  balls: BallState[]
  playingBallIds: string[]
  spawnBall: (position: PositionType, options?: { isPlaying?: boolean }) => void
  deleteBall: (id: string) => void
  drainBall: (id: string) => BallDrainResult
  resetBalls: () => void
  setBallPlaying: (id: string, isPlaying: boolean) => void
}

interface BallDrainResult {
  wasTracked: boolean
  remainingBallCount: number
  remainingPlayingBallCount: number
  isLifeLost: boolean
}

const getDrainResult = (
  balls: BallState[],
  playingBallIds: string[],
  wasTracked: boolean,
): BallDrainResult => {
  return {
    wasTracked,
    remainingBallCount: balls.length,
    remainingPlayingBallCount: playingBallIds.length,
    isLifeLost: wasTracked && balls.length === 0,
  }
}

const useBallStore = create<BallStore>()((set, get) => ({
  balls: [],
  playingBallIds: [],
  spawnBall: (position, options) => {
    playSfx("ball_new")
    if (options?.isPlaying) resetTilt()
    const id = crypto.randomUUID()
    set((state) => ({
      balls: [...state.balls, { id, position }],
      playingBallIds: options?.isPlaying ? [...state.playingBallIds, id] : state.playingBallIds,
    }))
  },
  deleteBall: (id) => {
    set((state) => ({
      balls: state.balls.filter((ball) => ball.id !== id),
      playingBallIds: state.playingBallIds.filter((playingBallId) => playingBallId !== id),
    }))
  },
  drainBall: (id) => {
    const state = get()
    const nextBalls = state.balls.filter((ball) => ball.id !== id)
    const nextPlayingBallIds = state.playingBallIds.filter((playingBallId) => playingBallId !== id)
    const wasTracked =
      nextBalls.length !== state.balls.length ||
      nextPlayingBallIds.length !== state.playingBallIds.length

    if (wasTracked) {
      set({
        balls: nextBalls,
        playingBallIds: nextPlayingBallIds,
      })
    }

    return getDrainResult(nextBalls, nextPlayingBallIds, wasTracked)
  },
  resetBalls: () => {
    set({ balls: [], playingBallIds: [] })
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
