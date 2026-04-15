import { createContext, useRef, type ReactNode, type RefObject } from "react"
import type * as THREE from "three"
import { PLAYFIELD_TILT_RAD } from "./physicsConfig"

export interface PlayfieldContextValue {
  ref: RefObject<THREE.Group | null>
}

export const PlayfieldContext = createContext<PlayfieldContextValue | null>(null)

interface PlayfieldProviderProps {
  children: ReactNode
}

export function PlayfieldProvider({ children }: PlayfieldProviderProps) {
  const ref = useRef<THREE.Group>(null)

  return (
    <PlayfieldContext.Provider value={{ ref }}>
      <group name="playfield" ref={ref} rotation={[-PLAYFIELD_TILT_RAD, 0, 0]}>
        {children}
      </group>
    </PlayfieldContext.Provider>
  )
}
