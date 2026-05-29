import { create } from "zustand"

interface ScorePopup {
  id: number
  amount: number
  position: { x: number; y: number; z: number }
}

interface ScorePopupsState {
  popups: ScorePopup[]
  addPopup: (amount: number, position: { x: number; y: number; z: number }) => void
  removePopup: (id: number) => void
}

let nextId = 0

const useScorePopupsStore = create<ScorePopupsState>((set) => ({
  popups: [],
  addPopup: (amount, position) =>
    { set((state) => ({
      popups: [...state.popups, { id: nextId++, amount, position }],
    })); },
  removePopup: (id) => { set((state) => ({ popups: state.popups.filter((p) => p.id !== id) })); },
}))

export default useScorePopupsStore
