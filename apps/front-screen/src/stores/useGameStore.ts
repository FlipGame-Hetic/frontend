import { create } from "zustand"

export type GamePhase = "waiting" | "playing" | "paused" | "ended"

interface GameStore {
  phase: GamePhase
  score: number
  ballNumber: number
  totalPlayers: number
  currentPlayer: number

  setPhase: (phase: GamePhase) => void
  addScore: (points: number) => void
  setScore: (score: number) => void
  nextBall: () => void
  reset: () => void
}

const INITIAL_STATE = {
  phase: "waiting" as GamePhase,
  score: 0,
  ballNumber: 1,
  totalPlayers: 1,
  currentPlayer: 1,
}

const useGameStore = create<GameStore>()((set) => ({
  ...INITIAL_STATE,

  setPhase: (phase) => {
    set({ phase })
  },

  addScore: (points) => {
    set((state) => ({ score: state.score + points }))
  },

  setScore: (score) => {
    set({ score })
  },

  nextBall: () => {
    set((state) => ({ ballNumber: state.ballNumber + 1 }))
  },

  reset: () => {
    set(INITIAL_STATE)
  },
}))

export default useGameStore
