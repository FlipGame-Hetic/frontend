import { create } from "zustand"

interface PlayfieldReadyStore {
  ready: boolean
  setReady: (ready: boolean) => void
}

const usePlayfieldReadyStore = create<PlayfieldReadyStore>()((set) => ({
  ready: false,
  setReady: (ready) => {
    set({ ready })
  },
}))

export default usePlayfieldReadyStore
