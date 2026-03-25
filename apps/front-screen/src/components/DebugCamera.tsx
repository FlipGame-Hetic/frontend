import { OrbitControls } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { useEffect, useRef, type ComponentRef } from "react"
import type { Vector3Tuple } from "three"

interface DebugCameraProps {
  cameraPosition: Vector3Tuple
  cameraFov: number
}

const DebugCamera = ({ cameraPosition, cameraFov }: DebugCameraProps) => {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null)
  const getState = useThree((s) => s.get)

  const { enabled } = useControls("Main", {
    enabled: { value: false, label: "Orbit controls" },
  })

  useEffect(() => {
    if (enabled) return
    requestAnimationFrame(() => {
      const { camera } = getState()
      camera.position.set(...cameraPosition)
      camera.lookAt(0, 0, 0)
      if ("fov" in camera) {
        camera.fov = cameraFov
        camera.updateProjectionMatrix()
      }
    })
  }, [enabled, getState, cameraPosition, cameraFov])

  if (!enabled) return null

  return <OrbitControls ref={controlsRef} makeDefault />
}

export default DebugCamera
