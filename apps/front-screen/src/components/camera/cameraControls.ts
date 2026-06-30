import { runtimeEnvironment } from "@frontend/utils"
import { useControls } from "leva"
import { CABINET_CAMERA } from "./cameraConfig"
import { DEMO_CAMERA_PATHS } from "./demoPaths"
import type { CabinetCameraSettings } from "./gameplayCameraPose"

interface DemoCameraDebugControls {
  showPaths: boolean
  pathIndex: number
  scrub: number
}

interface CameraControls {
  cabinetCamera: CabinetCameraSettings
  demoCameraDebug: DemoCameraDebugControls
}

export const useCameraControls = (): CameraControls => {
  const cabinetCamera = useControls(
    "Cabinet Camera",
    {
      fov: { value: CABINET_CAMERA.fov, min: 10, max: 200, step: 0.5 },
      posX: { value: CABINET_CAMERA.posX, min: -50, max: 50, step: 0.1, label: "pos X" },
      posY: { value: CABINET_CAMERA.posY, min: -50, max: 50, step: 0.1, label: "pos Y" },
      posZ: { value: CABINET_CAMERA.posZ, min: -50, max: 50, step: 0.1, label: "pos Z" },
      rotX: { value: CABINET_CAMERA.rotX, min: -180, max: 180, step: 1, label: "rot X (deg)" },
      rotY: { value: CABINET_CAMERA.rotY, min: -180, max: 180, step: 1, label: "rot Y (deg)" },
      rotZ: { value: CABINET_CAMERA.rotZ, min: -180, max: 180, step: 1, label: "rot Z (deg)" },
    },
    { collapsed: !runtimeEnvironment.isProductionCabinet },
  ) as CabinetCameraSettings

  const demoCameraDebug = useControls(
    "Demo Camera",
    {
      showPaths: false,
      pathIndex: {
        value: 0,
        min: 0,
        max: DEMO_CAMERA_PATHS.length - 1,
        step: 1,
        label: "Path",
      },
      scrub: { value: 0, min: 0, max: 1, step: 0.001 },
    },
    { collapsed: true },
  ) as DemoCameraDebugControls

  return { cabinetCamera, demoCameraDebug }
}
