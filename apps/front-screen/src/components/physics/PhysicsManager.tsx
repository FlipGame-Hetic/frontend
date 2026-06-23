import { Stats } from "@react-three/drei"
import { Physics } from "@react-three/rapier"
import { useControls } from "leva"
import { useEffect, useRef, type ReactNode } from "react"
import useKeyBinding from "@/hooks/useKeyBinding"
import useUltimateStore from "@/stores/useUltimateStore"
import { GRAVITY_Y, GRAVITY_Z, SLOW_MOTION_SPEED, TIME_STEP } from "./physicsConfig"
import SlowMotionStepper from "./SlowMotionStepper"
import { runtimeEnvironment } from "@frontend/utils"

interface PhysicsManagerProps {
  isDebug: boolean
  children: ReactNode
}

const PhysicsManager = ({ children, isDebug }: PhysicsManagerProps) => {
  const [{ slowMotion, slowMotionSpeed }, setMotion] = useControls(
    "Motion",
    () => ({
      slowMotion: { value: false, label: "Slow motion" },
      slowMotionSpeed: {
        value: SLOW_MOTION_SPEED,
        min: 0.05,
        max: 1,
        step: 0.05,
        label: "Speed",
      },
    }),
    { order: 3 },
  )

  const ultiTimeScale = useUltimateStore((state) => state.timeScale)
  const isUltiTimeActive = ultiTimeScale !== 1
  const stepperActive = slowMotion || isUltiTimeActive
  const stepperSpeed = isUltiTimeActive ? ultiTimeScale : slowMotionSpeed

  const slowMotionRef = useRef(slowMotion)
  useEffect(() => {
    slowMotionRef.current = slowMotion
  }, [slowMotion])

  useKeyBinding(
    "ControlLeft",
    () => {
      setMotion({ slowMotion: !slowMotionRef.current })
    },
    { enabled: runtimeEnvironment.isLocal },
  )

  return (
    <Physics
      debug={isDebug}
      gravity={[0, GRAVITY_Y, GRAVITY_Z]}
      timeStep={TIME_STEP}
      paused={stepperActive}
    >
      {isDebug && <Stats showPanel={0} />}
      {stepperActive && <SlowMotionStepper speed={stepperSpeed} />}
      {children}
    </Physics>
  )
}

export default PhysicsManager
