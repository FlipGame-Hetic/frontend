import { Physics } from "@react-three/rapier"
import { useControls } from "leva"
import type { ReactNode } from "react"
import { GRAVITY_Y, GRAVITY_Z, TIME_STEP } from "./physicsConfig"

interface PhysicsManagerProps {
  isDebug: boolean
  children: ReactNode
}

const PhysicsManager = ({ children, isDebug }: PhysicsManagerProps) => {
  const { gravityY, gravityZ } = useControls("Gravity", {
    gravityY: { value: GRAVITY_Y, min: -10, max: 10, step: 0.1 },
    gravityZ: { value: GRAVITY_Z, min: 0, max: 100, step: 0.1 },
  })

  return (
    <Physics debug={isDebug} gravity={[0, gravityY, gravityZ]} timeStep={TIME_STEP}>
      {children}
    </Physics>
  )
}

export default PhysicsManager
