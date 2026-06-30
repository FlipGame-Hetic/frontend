import { create } from "zustand"

interface WireframeStore {
  wireframe: boolean
  toggle: () => void
}

// front-screen-only Rapier physics wireframe toggle, composed onto the shared
// window.debug() in src/debug/registerDebugConsole.ts
const useWireframeStore = create<WireframeStore>()((set, get) => ({
  wireframe: false,
  toggle: () => {
    set({ wireframe: !get().wireframe })
  },
}))

export default useWireframeStore
