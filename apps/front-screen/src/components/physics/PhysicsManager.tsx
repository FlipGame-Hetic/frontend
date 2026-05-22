import { useFrame } from "@react-three/fiber"
import { Stats } from "@react-three/drei"
import { Physics, useRapier } from "@react-three/rapier"
import { PhysicsDebugProvider, usePhysicsDebugControls } from "@/debug/physicsDebugContext"
import type { ReactNode } from "react"
import { TIME_STEP } from "./physicsConfig"

interface PhysicsManagerProps {
  isDebug: boolean
  children: ReactNode
}

const PhysicsManager = ({ children, isDebug }: PhysicsManagerProps) => {
  return (
    <PhysicsDebugProvider>
      <PhysicsWorld isDebug={isDebug}>{children}</PhysicsWorld>
    </PhysicsDebugProvider>
  )
}

const PhysicsWorld = ({ children, isDebug }: PhysicsManagerProps) => {
  const {
    motion: { slowMotion, slowMotionSpeed },
    gravity: { gravityY, gravityZ },
  } = usePhysicsDebugControls()

  return (
    <Physics
      debug={isDebug}
      gravity={[0, gravityY, gravityZ]}
      timeStep={TIME_STEP}
      paused={slowMotion}
    >
      {isDebug && <Stats showPanel={0} />}
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
