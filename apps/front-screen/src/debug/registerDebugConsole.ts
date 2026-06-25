import useDebugOverlayStore from "@/stores/useDebugOverlayStore"

declare global {
  interface Window {
    debug: () => string
  }
}

// Exposes window.debug() to toggle the Leva panel + Stats overlay at runtime
export const registerDebugConsole = (): void => {
  window.debug = () => {
    useDebugOverlayStore.getState().toggle()
    return `debug overlay ${useDebugOverlayStore.getState().visible ? "ON" : "OFF"}`
  }
}
