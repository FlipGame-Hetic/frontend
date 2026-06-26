import { OrbitControls } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { useDebugControls } from "@/debug/debugContext"
import { useControls } from "leva"
import { useLayoutEffect } from "react"
import { PerspectiveCamera } from "three"

interface CabinetCameraPose {
  fov: number
  posX: number
  posY: number
  posZ: number
  rotX: number
  rotY: number
  rotZ: number
}

const FixedCabinetCamera = ({ fov, posX, posY, posZ, rotX, rotY, rotZ }: CabinetCameraPose) => {
  const get = useThree((s) => s.get)
  const size = useThree((s) => s.size)

  useLayoutEffect(() => {
    const camera = get().camera
    if (!(camera instanceof PerspectiveCamera)) return

    camera.fov = fov
    camera.position.set(posX, posY, posZ)
    camera.rotation.set((rotX * Math.PI) / 180, (rotY * Math.PI) / 180, (rotZ * Math.PI) / 180)
    camera.updateProjectionMatrix()
  }, [get, size.width, size.height, fov, posX, posY, posZ, rotX, rotY, rotZ])

  return null
}

// Production cabinet camera : immobile overhead framing tuned using Leva
const CabinetCamera = () => {
  const { enabled: OrbitControlsEnabled } = useDebugControls()

  const cameraPose = useControls("Cabinet Camera", {
    fov: { value: 38, min: 10, max: 200, step: 0.5 },
    posX: { value: 0, min: -50, max: 50, step: 0.1, label: "pos X" },
    posY: { value: 18.3, min: -50, max: 50, step: 0.1, label: "pos Y" },
    posZ: { value: 10.5, min: -50, max: 50, step: 0.1, label: "pos Z" },
    rotX: { value: -60, min: -180, max: 180, step: 1, label: "rot X (deg)" },
    rotY: { value: 0, min: -180, max: 180, step: 1, label: "rot Y (deg)" },
    rotZ: { value: 0, min: -180, max: 180, step: 1, label: "rot Z (deg)" },
  })

  return OrbitControlsEnabled ? (
    <OrbitControls makeDefault />
  ) : (
    <FixedCabinetCamera {...cameraPose} />
  )
}

export default CabinetCamera
