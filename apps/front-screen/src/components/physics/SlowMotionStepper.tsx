import { useRapier } from "@react-three/rapier"
import { useFrame } from "@react-three/fiber"

const SlowMotionStepper = ({ speed }: { speed: number }) => {
  const { step } = useRapier()
  useFrame((_, delta) => {
    step(delta * speed)
  })
  return null
}

export default SlowMotionStepper
