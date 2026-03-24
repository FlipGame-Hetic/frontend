import { Physics } from "@react-three/rapier"
import { useControls } from "leva"
import type { ReactNode } from "react"

interface PhysicsManagerProps {
  isDebug: boolean
  children: ReactNode
}

const PhysicsManager = ({ children, isDebug }: PhysicsManagerProps) => {
  const { gravityY, gravityZ } = useControls("Gravity", {
    gravityY: { value: -2, min: -10, max: 0, step: 0.1 },
    gravityZ: { value: 8, min: 0, max: 20, step: 0.1 },
  })

  return (
    <Physics debug={isDebug} gravity={[0, gravityY, gravityZ]}>
      {children}
    </Physics>
  )
}

export default PhysicsManager
