import { Physics } from "@react-three/rapier"
import { useControls } from "leva"
import type { ReactNode } from "react"
import { GRAVITY_MAGNITUDE, TIME_STEP } from "./physicsConfig"

interface PhysicsManagerProps {
  isDebug: boolean
  children: ReactNode
}

const PhysicsManager = ({ children, isDebug }: PhysicsManagerProps) => {
  const { gravityY } = useControls("Gravity", {
    gravityY: { value: GRAVITY_MAGNITUDE, min: -40, max: -1, step: 0.5 },
  })

  return (
    <Physics debug={isDebug} gravity={[0, gravityY, 0]} timeStep={TIME_STEP}>
      {children}
    </Physics>
  )
}

export default PhysicsManager
