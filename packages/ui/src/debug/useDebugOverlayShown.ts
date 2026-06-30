import { runtimeEnvironment } from "@frontend/utils"
import { useDebugOverlayStore } from "./useDebugOverlayStore"

// The debug GUI shows outside production, or on demand in production via window.debug()
export const useDebugOverlayShown = (): boolean => {
  const visible = useDebugOverlayStore((state) => state.visible)
  return !runtimeEnvironment.isProduction || visible
}
