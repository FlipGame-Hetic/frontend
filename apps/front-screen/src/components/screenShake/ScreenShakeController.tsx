import useScreenShakeStore from "@/stores/useScreenShakeStore"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { Vector3 } from "three"
import {
  MAX_OFFSET,
  MAX_OFFSET_Y,
  MAX_OFFSET_Z,
  SCREEN_SHAKE_FRAME_PRIORITY,
  TRAUMA_DECAY,
} from "./screenShakeConfig"

const ScreenShakeController = () => {
  const lastOffset = useRef(new Vector3())

  useFrame((state, delta) => {
    const camera = state.camera
    camera.position.sub(lastOffset.current)

    const trauma = useScreenShakeStore.getState().trauma
    if (trauma <= 0) {
      lastOffset.current.set(0, 0, 0)
      return
    }

    const shake = trauma * trauma
    const ox = MAX_OFFSET * shake * (Math.random() * 2 - 1)
    const oy = MAX_OFFSET_Y * shake * (Math.random() * 2 - 1)
    const oz = MAX_OFFSET_Z * shake * (Math.random() * 2 - 1)

    lastOffset.current.set(ox, oy, oz)
    camera.position.add(lastOffset.current)

    useScreenShakeStore.getState().setTrauma(trauma - TRAUMA_DECAY * delta)
  }, SCREEN_SHAKE_FRAME_PRIORITY)

  return null
}

export default ScreenShakeController
