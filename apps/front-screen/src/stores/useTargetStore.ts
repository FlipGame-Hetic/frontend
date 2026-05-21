import { create } from "zustand"

export interface TargetHit {
  id: string
  hitAt: number
}

interface TargetStore {
  activatedTargetIds: string[]
  targetHits: TargetHit[]
  activateTarget: (id: string) => void
  recordTargetHit: (id: string) => void
  resetTarget: (id: string) => void
  resetTargets: () => void
}

const useTargetStore = create<TargetStore>()((set) => ({
  activatedTargetIds: [],
  targetHits: [],

  activateTarget: (id) => {
    set((state) => {
      if (state.activatedTargetIds.includes(id)) return state
      return { activatedTargetIds: [...state.activatedTargetIds, id] }
    })
  },

  recordTargetHit: (id) => {
    set((state) => ({
      targetHits: [...state.targetHits, { id, hitAt: performance.now() }],
    }))
  },

  resetTarget: (id) => {
    set((state) => ({
      activatedTargetIds: state.activatedTargetIds.filter((targetId) => targetId !== id),
    }))
  },

  resetTargets: () => {
    set({ activatedTargetIds: [], targetHits: [] })
  },
}))

export default useTargetStore
