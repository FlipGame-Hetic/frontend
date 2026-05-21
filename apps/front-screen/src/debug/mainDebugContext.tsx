import { useControls } from "leva"
import { createContext, useContext, type ReactNode } from "react"

export interface MainDebugControls {
  testBench: boolean
  enabled: boolean
  autoMode: boolean
}

const MainDebugContext = createContext<MainDebugControls | null>(null)

export function useMainDebugControls(): MainDebugControls {
  const ctx = useContext(MainDebugContext)
  if (!ctx) {
    throw new Error("useMainDebugControls must be used within MainDebugProvider")
  }
  return ctx
}

export function MainDebugProvider({ children }: { children: ReactNode }) {
  const controls = useControls(
    "Main",
    {
      testBench: false,
      enabled: { value: true, label: "Orbit controls" },
      autoMode: false,
    },
    { order: 0 },
  )

  return <MainDebugContext.Provider value={controls}>{children}</MainDebugContext.Provider>
}
