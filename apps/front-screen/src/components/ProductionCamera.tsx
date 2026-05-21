import { useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { useLayoutEffect } from "react"
import { PerspectiveCamera } from "three"

const ProductionCamera = () => {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  const { fov, playfieldWidthX, surfaceY, minZ, centerX, rotX, rotY, rotZ } = useControls(
    "Production Camera",
    {
      fov: { value: 51, min: 10, max: 90, step: 0.5 },
      playfieldWidthX: { value: 19, min: 1, max: 20, step: 0.1 },
      surfaceY: { value: 2, min: -50, max: 20, step: 0.1 },
      minZ: { value: -1.2, min: -20, max: 0, step: 0.05 },
      centerX: { value: 0.1, min: -10, max: 10, step: 0.05 },
      rotX: { value: -77, min: -180, max: 180, step: 1, label: "rot X (deg)" },
      rotY: { value: 0, min: -180, max: 180, step: 1, label: "rot Y (deg)" },
      rotZ: { value: 0, min: -180, max: 180, step: 1, label: "rot Z (deg)" },
    },
  )

  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return

    const aspect = size.width / size.height
    const fovRad = (fov * Math.PI) / 180
    const H = playfieldWidthX / 2 / Math.tan(fovRad / 2)
    const cameraY = surfaceY + H
    const cameraZ = minZ + (playfieldWidthX * aspect) / 2

    camera.position.set(centerX, cameraY, cameraZ)
    camera.rotation.set((rotX * Math.PI) / 180, (rotY * Math.PI) / 180, (rotZ * Math.PI) / 180)
    camera.updateProjectionMatrix()
  }, [
    camera,
    size.width,
    size.height,
    fov,
    playfieldWidthX,
    surfaceY,
    minZ,
    centerX,
    rotX,
    rotY,
    rotZ,
  ])

  return null
}

export default ProductionCamera
