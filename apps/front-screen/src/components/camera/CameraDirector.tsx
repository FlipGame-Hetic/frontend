import { useDebugControls } from "@/debug/debugContext"
import { runtimeEnvironment } from "@frontend/utils"
import { OrbitControls } from "@react-three/drei"
import { useMemo } from "react"
import { useCameraControls } from "./cameraControls"
import DemoPathDebug from "./DemoPathDebug"
import { getGameplayCameraPose } from "./gameplayCameraPose"
import { useCameraDirector } from "./useCameraDirector"

const CameraDirector = () => {
  const { enabled: orbitControlsEnabled } = useDebugControls()
  const { cabinetCamera, demoCameraDebug } = useCameraControls()

  const {
    fov: cabinetFov,
    posX: cabinetPosX,
    posY: cabinetPosY,
    posZ: cabinetPosZ,
    rotX: cabinetRotX,
    rotY: cabinetRotY,
    rotZ: cabinetRotZ,
  } = cabinetCamera

  const gameplayPose = useMemo(
    () =>
      getGameplayCameraPose({
        isProductionCabinet: runtimeEnvironment.isProductionCabinet,
        cabinetCamera: {
          fov: cabinetFov,
          posX: cabinetPosX,
          posY: cabinetPosY,
          posZ: cabinetPosZ,
          rotX: cabinetRotX,
          rotY: cabinetRotY,
          rotZ: cabinetRotZ,
        },
      }),
    [cabinetFov, cabinetPosX, cabinetPosY, cabinetPosZ, cabinetRotX, cabinetRotY, cabinetRotZ],
  )

  useCameraDirector({ gameplayPose, orbitControlsEnabled })

  return (
    <>
      {orbitControlsEnabled ? <OrbitControls makeDefault /> : null}
      {orbitControlsEnabled && demoCameraDebug.showPaths ? (
        <DemoPathDebug pathIndex={demoCameraDebug.pathIndex} scrub={demoCameraDebug.scrub} />
      ) : null}
    </>
  )
}

export default CameraDirector
