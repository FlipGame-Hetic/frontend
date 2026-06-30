import {
  registerDebugConsole as registerSharedDebugConsole,
  useDebugOverlayStore,
} from "@frontend/ui"
import useWireframeStore from "@/stores/useWireframeStore"

// Extends the shared window.debug() with front-screen's Rapier wireframe toggle:
// window.debug({ wireframe }) flips the physics wireframe only when the value changes,
// otherwise falls through to the shared overlay-visibility toggle.
export const registerDebugConsole = (): void => {
  registerSharedDebugConsole((options) => {
    const { wireframe } = useWireframeStore.getState()
    if (options && "wireframe" in options && Boolean(options.wireframe) !== wireframe) {
      useWireframeStore.getState().toggle()
      const visible = useDebugOverlayStore.getState().visible
      const nextWireframe = useWireframeStore.getState().wireframe
      return `physics wireframe ${visible && nextWireframe ? "ON" : "OFF"}`
    }
    return undefined
  })
}
