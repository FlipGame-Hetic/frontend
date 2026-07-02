import { useRapier } from "@react-three/rapier"
import { useFrame } from "@react-three/fiber"

// Cap the frame delta before scaling : rapier's step() runs a 1/240 accumulator, so one long frame would fire up to 120 catch-up substeps and cascade. 1/20 is a no-op at any frame rate >= 20fps and only engages when already hitching
const MAX_FRAME_DELTA = 1 / 20

// Mounted only while Rapier's own loop is paused, so we drive the world by hand at a scaled delta to get slow-motion / ulti time-scale
const TimeStepper = ({ speed }: { speed: number }) => {
  const { step } = useRapier()
  useFrame((_, delta) => {
    step(Math.min(delta, MAX_FRAME_DELTA) * speed)
  })
  return null
}

export default TimeStepper
