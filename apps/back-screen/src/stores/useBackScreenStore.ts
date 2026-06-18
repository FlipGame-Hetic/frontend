import { create } from "zustand"
import type { GamePhase, GameMode, CharacterType } from "@frontend/types"
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

  bossId: number | null
  bossHp: number
  bossMaxHp: number
  bossActive: boolean
  bossDefeatedAt: number
  lastDamage: DamageEvent

  setPhase: (phase: GamePhase) => void
  setMenuIndex: (index: number) => void
  setSelectedMode: (mode: GameMode) => void
  setSelectedCharacter: (character: CharacterType) => void
  setScore: (score: number) => void
  setBallNumber: (n: number) => void
  setBoss: (boss: BossState) => void
  markBossDefeated: () => void
  resetBoss: () => void
}

export const useBackScreenStore = create<BackScreenStore>()((set) => ({
  phase: "idle",
  menuIndex: 0,
  selectedMode: null,
  selectedCharacter: null,
  score: 0,
  ballNumber: 1,

  bossId: null,
  bossHp: 0,
  bossMaxHp: 0,
  bossActive: false,
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
  setBoss: ({ bossId, bossHp, bossMaxHp }) => {
    set((state) => {
      const delta = state.bossActive ? state.bossHp - bossHp : 0
      const lastDamage =
        delta > 0 ? { at: Date.now(), delta, big: isBigDamage(delta, bossMaxHp) } : state.lastDamage
      return { bossId, bossHp, bossMaxHp, bossActive: true, lastDamage }
    })
  },
  markBossDefeated: () => {
    set({ bossDefeatedAt: Date.now() })
  },
  resetBoss: () => {
    set({
      bossId: null,
      bossHp: 0,
      bossMaxHp: 0,
      bossActive: false,
      bossDefeatedAt: 0,
      lastDamage: NO_DAMAGE,
    })
  },
}))
