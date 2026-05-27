import { create } from "zustand"
import type { CharacterType, GameMode, GamePhase } from "@frontend/types"
import { PLUNGER_BALL_SPAWN } from "@/components/plunger/plungerConfig"
import useBallStore from "./useBallStore"
import useTargetStore from "./useTargetStore"

interface SelectedPlayer {
  player: number
  character: CharacterType
}

interface StartGameOptions {
  mode: GameMode
  players: SelectedPlayer[]
}

interface GameStore {
  phase: GamePhase
  mode: GameMode | null
  selectedPlayers: SelectedPlayer[]
  score: number
  ballNumber: number
  totalBalls: number
  totalPlayers: number
  currentPlayer: number

  setPhase: (phase: GamePhase) => void
  selectMode: (mode: GameMode) => void
  selectCharacter: (player: number, character: CharacterType) => void
  startGame: (options?: StartGameOptions) => void
  endGame: () => void
  pause: () => void
  resume: () => void
  addScore: (points: number) => void
  setScore: (score: number) => void
  nextBall: () => void
  reset: () => void
  restartGame: () => void
}

const TOTAL_BALLS_BY_MODE: Record<GameMode, number> = {
  solo: 3,
  duo: 3,
  boss: 5,
}

const INITIAL_STATE = {
  phase: "idle" as GamePhase,
  mode: null as GameMode | null,
  selectedPlayers: [] as SelectedPlayer[],
  score: 0,
  ballNumber: 1,
  totalBalls: 3,
  totalPlayers: 1,
  currentPlayer: 1,
}

const useGameStore = create<GameStore>()((set) => ({
  ...INITIAL_STATE,

  setPhase: (phase) => {
    set({ phase })
  },

  selectMode: (mode) => {
    set({ mode, phase: "character_select" })
  },

  selectCharacter: (player, character) => {
    set((state) => {
      const filtered = state.selectedPlayers.filter((p) => p.player !== player)
      return { selectedPlayers: [...filtered, { player, character }] }
    })
  },

  startGame: (options) => {
    useTargetStore.getState().resetTargets()
    useBallStore.getState().resetBalls()
    useBallStore.getState().spawnBall(PLUNGER_BALL_SPAWN, { isPlaying: false })

    set((state) => {
      const mode = options?.mode ?? state.mode ?? "solo"
      const selectedPlayers = options?.players ?? state.selectedPlayers

      return {
        phase: "playing",
        mode,
        selectedPlayers,
        score: 0,
        ballNumber: 1,
        currentPlayer: 1,
        totalBalls: TOTAL_BALLS_BY_MODE[mode],
        totalPlayers: Math.max(1, selectedPlayers.length),
      }
    })
  },

  endGame: () => {
    set({ phase: "game_over" })
  },

  pause: () => {
    set({ phase: "paused" })
  },

  resume: () => {
    set({ phase: "playing" })
  },

  addScore: (points) => {
    set((state) => ({ score: state.score + points }))
  },

  setScore: (score) => {
    set({ score })
  },

  nextBall: () => {
    set((state) => {
      if (state.ballNumber >= state.totalBalls) {
        return { phase: "game_over" as GamePhase }
      }
      return { ballNumber: state.ballNumber + 1 }
    })
  },

  reset: () => {
    useTargetStore.getState().resetTargets()
    useBallStore.getState().resetBalls()
    set(INITIAL_STATE)
  },

  restartGame: () => {
    useTargetStore.getState().resetTargets()
    useBallStore.getState().resetBalls()
    set({ ...INITIAL_STATE, phase: "mode_select" as GamePhase })
  },
}))

export default useGameStore
