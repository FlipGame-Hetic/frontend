import { useRapier } from "@react-three/rapier"
import { useFrame } from "@react-three/fiber"
import { MAX_FRAME_DELTA } from "./physicsConfig"

// Mounted only while Rapier's own loop is paused, so we drive the world by hand at a scaled delta to get slow-motion / ulti time-scale
const TimeStepper = ({ speed }: { speed: number }) => {
  const { step } = useRapier()
  useFrame((_, delta) => {
    step(Math.min(delta, MAX_FRAME_DELTA) * speed)
  })
  return null
}

export default TimeStepper
