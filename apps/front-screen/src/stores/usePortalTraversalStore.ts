import { create } from "zustand"

interface PortalTraversalStore {
  ghostBallIds: string[]
  addGhost: (ballId: string) => void
  removeGhost: (ballId: string) => void
  reset: () => void
}

const usePortalTraversalStore = create<PortalTraversalStore>()((set) => ({
  ghostBallIds: [],
  addGhost: (ballId) => {
    set((s) => ({ ghostBallIds: [...s.ghostBallIds, ballId] }))
  },
  removeGhost: (ballId) => {
    set((s) => ({ ghostBallIds: s.ghostBallIds.filter((id) => id !== ballId) }))
  },
  reset: () => {
    set({ ghostBallIds: [] })
  },
}))

export default usePortalTraversalStore
