import { create } from "zustand"
import type { GamePhase, GameMode, CharacterType, ScoreEntry } from "@frontend/types"
import { isBigDamage } from "@/boss/bossDamageConfig"

interface BossState {
  bossId: number
  bossHp: number
  bossMaxHp: number
}

interface DamageEvent {
  at: number
  delta: number
  big: boolean
}

const NO_DAMAGE: DamageEvent = { at: 0, delta: 0, big: false }

interface BackScreenStore {
  phase: GamePhase
  menuIndex: number
  selectedMode: GameMode | null
  selectedCharacter: CharacterType | null
  score: number
  ballNumber: number
  leaderboard: ScoreEntry[]

  bossId: number | null
  bossHp: number
  bossMaxHp: number
  bossActive: boolean
  bossReady: boolean
  bossDefeatedAt: number
  lastDamage: DamageEvent

  setPhase: (phase: GamePhase) => void
  setMenuIndex: (index: number) => void
  setSelectedMode: (mode: GameMode) => void
  setSelectedCharacter: (character: CharacterType) => void
  setScore: (score: number) => void
  setBallNumber: (n: number) => void
  setLeaderboard: (entries: ScoreEntry[]) => void
  setBoss: (boss: BossState) => void
  setBossReady: () => void
  markBossDefeated: () => void
  clearBoss: () => void
  resetBoss: () => void
}

export const useBackScreenStore = create<BackScreenStore>()((set) => ({
  phase: "idle",
  menuIndex: 0,
  selectedMode: null,
  selectedCharacter: null,
  score: 0,
  ballNumber: 1,
  leaderboard: [],

  bossId: null,
  bossHp: 0,
  bossMaxHp: 0,
  bossActive: false,
  bossReady: false,
  bossDefeatedAt: 0,
  lastDamage: NO_DAMAGE,

  setPhase: (phase) => {
    set({ phase, menuIndex: 0 })
    if (phase !== "playing") {
      set({
        bossId: null,
        bossHp: 0,
        bossMaxHp: 0,
        bossActive: false,
        bossReady: false,
        bossDefeatedAt: 0,
        lastDamage: NO_DAMAGE,
      })
    }
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
  setBoss: ({ bossId, bossHp, bossMaxHp }) => {
    set((state) => {
      const delta = state.bossActive ? state.bossHp - bossHp : 0
      const lastDamage =
        delta > 0 ? { at: Date.now(), delta, big: isBigDamage(delta) } : state.lastDamage
      return {
        bossId,
        bossHp,
        bossMaxHp,
        bossActive: true,
        bossReady: state.bossActive ? state.bossReady : false,
        lastDamage,
        phase: "playing",
      }
    })
  },
  setBossReady: () => {
    set({ bossReady: true })
  },
  markBossDefeated: () => {
    set({ bossDefeatedAt: Date.now() })
  },
  clearBoss: () => {
    set({ bossActive: false, bossReady: false, bossDefeatedAt: 0, lastDamage: NO_DAMAGE })
  },
  resetBoss: () => {
    set({
      bossId: null,
      bossHp: 0,
      bossMaxHp: 0,
      bossActive: false,
      bossReady: false,
      bossDefeatedAt: 0,
      lastDamage: NO_DAMAGE,
    })
  },
}))
