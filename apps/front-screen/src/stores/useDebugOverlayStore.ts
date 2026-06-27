import { create } from "zustand"

interface DebugOverlayStore {
  visible: boolean
  wireframe: boolean
  toggle: () => void
  toggleWireframe: () => void
}

const useDebugOverlayStore = create<DebugOverlayStore>()((set, get) => ({
  visible: false,
  wireframe: false,
  toggle: () => {
    set({ visible: !get().visible })
  },
  toggleWireframe: () => {
    set({ wireframe: !get().wireframe })
  },
}))

export default useDebugOverlayStore
