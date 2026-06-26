import type { BallState } from "@/types/ballTypes"
import type { PositionType } from "@/types/worldTypes"
import { playSfx } from "@/audio/soundEngine"
import { create } from "zustand"

interface BallStore {
  balls: BallState[]
  playingBallIds: string[]
  spawnBall: (position: PositionType, options?: { isPlaying?: boolean }) => void
  deleteBall: (id: string) => void
  drainBall: (id: string) => BallDrainResult
  splitPlayingBalls: (positions: PositionType[]) => boolean
  resetBalls: () => void
  setBallPlaying: (id: string) => void
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
    // isLifeLost is true only when the drain emptied the last ball, so losing one ball mid-multiball is not counted as a life
    isLifeLost: wasTracked && balls.length === 0,
  }
}

const useBallStore = create<BallStore>()((set, get) => ({
  balls: [],
  playingBallIds: [],
  spawnBall: (position, options) => {
    playSfx("ball_new")
    const id = crypto.randomUUID()
    set((state) => ({
      balls: [...state.balls, { id, position }],
      // If playing, adds the new id to existing state array, otherwise leave as is (a ball spawned in plunger lane is not playing yet)
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
    // False when the id was already gone, so a potential duplicate drain event cannot remove a ball or lose a life twice
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
  // Used for Keenu's ultimate
  splitPlayingBalls: (positions) => {
    // Snapshot before mutating, so we only consume balls that are actually playing right now
    const snapshot = [...get().playingBallIds]
    // No playing ball to consume : the ball already committed its drain, so the split fizzles and spawns nothing
    if (snapshot.length === 0) return false

    for (const position of positions) {
      get().spawnBall(position, { isPlaying: true })
    }
    for (const id of snapshot) {
      get().deleteBall(id)
    }
    return true
  },
  resetBalls: () => {
    set({ balls: [], playingBallIds: [] })
  },
  setBallPlaying: (id) => {
    set((state) => {
      // Checks whether the ball had already been added to playingBalls to prevent duplicate sensor triggers
      const isAlreadyPlaying = state.playingBallIds.includes(id)
      if (isAlreadyPlaying) {
        return state
      }

      return {
        playingBallIds: [...state.playingBallIds, id],
      }
    })
  },
}))

export default useBallStore
