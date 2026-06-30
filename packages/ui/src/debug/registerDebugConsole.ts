import { useDebugOverlayStore } from "./useDebugOverlayStore"

export type DebugConsoleHandler = (options?: Record<string, unknown>) => string | undefined

declare global {
  interface Window {
    debug: (options?: Record<string, unknown>) => string
  }
}

const toggleOverlay = (): string => {
  useDebugOverlayStore.getState().toggle()
  return `debug overlay ${useDebugOverlayStore.getState().visible ? "ON" : "OFF"}`
}

// window.debug() toggles overlay visibility. An optional handler extends the command
// (e.g. front-screen's wireframe): returning a string short-circuits; returning
// undefined falls through to the default visibility toggle.
export const registerDebugConsole = (handler?: DebugConsoleHandler): void => {
  window.debug = (options) => handler?.(options) ?? toggleOverlay()
}
