import { create } from "zustand"

interface DebugOverlayStore {
  visible: boolean
  toggle: () => void
}

// Generic runtime visibility toggle for any app's debug GUI. Defaults hidden;
// flipped at runtime via registerDebugConsole's window.debug().
export const useDebugOverlayStore = create<DebugOverlayStore>()((set, get) => ({
  visible: false,
  toggle: () => {
    set({ visible: !get().visible })
  },
}))
