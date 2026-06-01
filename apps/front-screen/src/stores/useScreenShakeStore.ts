import { create } from "zustand"

interface ScreenShakeStore {
  trauma: number
  addTrauma: (amount: number) => void
  setTrauma: (t: number) => void
}

const useScreenShakeStore = create<ScreenShakeStore>()((set, get) => ({
  trauma: 0,
  addTrauma: (amount) => {
    set({ trauma: Math.min(1, get().trauma + amount) })
  },
  setTrauma: (t) => {
    set({ trauma: Math.max(0, t) })
  },
}))

export default useScreenShakeStore
