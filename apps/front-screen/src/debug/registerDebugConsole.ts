import useDebugOverlayStore from "@/stores/useDebugOverlayStore"

interface DebugOptions {
  wireframe?: boolean
}

declare global {
  interface Window {
    debug: (options?: DebugOptions) => string
  }
}

// window.debug() toggles the overlay; window.debug({ wireframe }) toggles the Rapier wireframes only when the value changes, otherwise it falls back to a plain overlay toggle
export const registerDebugConsole = (): void => {
  window.debug = (options) => {
    const { wireframe } = useDebugOverlayStore.getState()
    if (options && "wireframe" in options && Boolean(options.wireframe) !== wireframe) {
      useDebugOverlayStore.getState().toggleWireframe()
      const next = useDebugOverlayStore.getState()
      return `physics wireframe ${next.visible && next.wireframe ? "ON" : "OFF"}`
    }
    useDebugOverlayStore.getState().toggle()
    return `debug overlay ${useDebugOverlayStore.getState().visible ? "ON" : "OFF"}`
  }
}
