import { createContext, useContext } from "react"

export interface DebugControls {
  enabled: boolean
  autoMode: boolean
  bounceThreshold: number
  ballCount: number
}

export const DebugContext = createContext<DebugControls | null>(null)

export const useDebugControls = (): DebugControls => {
  const ctx = useContext(DebugContext)
  if (!ctx) throw new Error("useDebugControls must be used within DebugProvider")
  return ctx
}
