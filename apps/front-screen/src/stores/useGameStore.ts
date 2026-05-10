import { create } from "zustand"

export type GamePhase = "waiting" | "playing" | "paused" | "ended"

export const MAX_BALLS = 3
const ENDED_RESET_DELAY_MS = 5000

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
  startGame: () => void
  loseBall: () => void
  endGame: () => void
}

const INITIAL_STATE = {
  phase: "waiting" as GamePhase,
  score: 0,
  ballNumber: 1,
  totalPlayers: 1,
  currentPlayer: 1,
}

const useGameStore = create<GameStore>()((set, get) => ({
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

  startGame: () => {
    set({ ...INITIAL_STATE, phase: "playing" })
  },

  loseBall: () => {
    const { phase, ballNumber, nextBall, endGame } = get()
    if (phase !== "playing") return
    if (ballNumber < MAX_BALLS) {
      nextBall()
    } else {
      endGame()
    }
  },

  endGame: () => {
    set({ phase: "ended" })
    setTimeout(() => {
      get().reset()
    }, ENDED_RESET_DELAY_MS)
  },
}))

export default useGameStore
