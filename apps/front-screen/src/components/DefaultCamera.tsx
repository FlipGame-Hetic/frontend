import { OrbitControls } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { useDebugControls } from "@/debug/debugContext"
import { useEffect, useRef, type ComponentRef } from "react"
import { DEFAULT_CAMERA } from "./cameraConfig"

const DefaultCamera = () => {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null)
  const getState = useThree((s) => s.get)

  const { enabled } = useDebugControls()

  useEffect(() => {
    if (enabled) return
    // Wait for next frame so our placement runs after R3F finishes setting up its camera, otherwise our gets overwritten
    requestAnimationFrame(() => {
      const { camera } = getState()
      camera.position.set(...DEFAULT_CAMERA.position)
      camera.lookAt(0, 0, 0)
      if ("fov" in camera) {
        camera.fov = DEFAULT_CAMERA.fov
        camera.updateProjectionMatrix()
      }
    })
  }, [enabled, getState])

  if (!enabled) return null

  return <OrbitControls ref={controlsRef} makeDefault />
}

export default DefaultCamera
