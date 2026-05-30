import { create } from "zustand"
import useBallStore from "./useBallStore"

interface ScorePopup {
  id: number
  amount: number
  position: { x: number; y: number; z: number }
}

interface ScorePopupsState {
  popups: ScorePopup[]
  lastHitPosition: { x: number; y: number; z: number }
  addPopup: (amount: number, position: { x: number; y: number; z: number }) => void
  removePopup: (id: number) => void
  setLastHitPosition: (position: { x: number; y: number; z: number }) => void
  spawnPopupFromDelta: (amount: number, reason?: string) => void
}

let nextId = 0

const useScorePopupsStore = create<ScorePopupsState>((set, get) => ({
  popups: [],
  lastHitPosition: { x: 0, y: 0, z: 0 },
  addPopup: (amount, position) => {
    set((state) => ({
      popups: [...state.popups, { id: nextId++, amount, position }],
    }))
  },
  removePopup: (id) => {
    set((state) => ({ popups: state.popups.filter((p) => p.id !== id) }))
  },
  setLastHitPosition: (position) => {
    set({ lastHitPosition: position })
  },
  spawnPopupFromDelta: (amount, reason) => {
    const balls = useBallStore.getState().balls
    const { lastHitPosition } = get()
    const position = balls.length > 1 && reason === "combo" ? { x: 0, y: 0, z: 0 } : lastHitPosition
    set((state) => ({
      popups: [...state.popups, { id: nextId++, amount, position }],
    }))
  },
}))

export default useScorePopupsStore
