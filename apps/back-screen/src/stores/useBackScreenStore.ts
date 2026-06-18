import { create } from "zustand"
import type { GamePhase, GameMode, CharacterType, ScoreEntry } from "@frontend/types"

interface BackScreenStore {
  phase: GamePhase
  menuIndex: number
  selectedMode: GameMode | null
  selectedCharacter: CharacterType | null
  score: number
  ballNumber: number
  leaderboard: ScoreEntry[]

  setPhase: (phase: GamePhase) => void
  setMenuIndex: (index: number) => void
  setSelectedMode: (mode: GameMode) => void
  setSelectedCharacter: (character: CharacterType) => void
  setScore: (score: number) => void
  setBallNumber: (n: number) => void
  setLeaderboard: (entries: ScoreEntry[]) => void
}

export const useBackScreenStore = create<BackScreenStore>()((set) => ({
  phase: "idle",
  menuIndex: 0,
  selectedMode: null,
  selectedCharacter: null,
  score: 0,
  ballNumber: 1,
  leaderboard: [],

  setPhase: (phase) => {
    set({ phase, menuIndex: 0 })
  },
  setMenuIndex: (menuIndex) => {
    set({ menuIndex })
  },
  setSelectedMode: (selectedMode) => {
    set({ selectedMode })
  },
  setSelectedCharacter: (selectedCharacter) => {
    set({ selectedCharacter })
  },
  setScore: (score) => {
    set({ score })
  },
  setBallNumber: (ballNumber) => {
    set({ ballNumber })
  },
  setLeaderboard: (leaderboard) => {
    set({ leaderboard })
  },
}))
