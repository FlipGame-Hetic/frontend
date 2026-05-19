import { useFrame } from "@react-three/fiber"
import { Physics, useRapier } from "@react-three/rapier"
import { PhysicsDebugProvider, usePhysicsDebugControls } from "@/debug/physicsDebugContext"
import type { ReactNode } from "react"
import { TIME_STEP } from "./physicsConfig"

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
    <Physics
      debug={isDebug}
      gravity={[0, gravityY, gravityZ]}
      timeStep={TIME_STEP}
      paused={slowMotion}
    >
      {slowMotion && <SlowMotionStepper speed={slowMotionSpeed} />}
      {children}
    </Physics>
  )
}

const SlowMotionStepper = ({ speed }: { speed: number }) => {
  const { step } = useRapier()

  useFrame((_, delta) => {
    step(delta * speed)
  })

  return null
}

export default PhysicsManager
