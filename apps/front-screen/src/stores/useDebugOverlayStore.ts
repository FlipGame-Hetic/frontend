import { create } from "zustand"

interface DebugOverlayStore {
  visible: boolean
  toggle: () => void
}

const useDebugOverlayStore = create<DebugOverlayStore>()((set, get) => ({
  visible: false,
  toggle: () => {
    set({ visible: !get().visible })
  },
}))

export default useDebugOverlayStore
