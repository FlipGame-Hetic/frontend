import { Euler, Object3D, Quaternion, Vector3 } from "three"
import { DEFAULT_CAMERA } from "./cameraConfig"

export interface CameraPose {
  position: Vector3
  quaternion: Quaternion
  fov: number
}

export interface CabinetCameraSettings {
  fov: number
  posX: number
  posY: number
  posZ: number
  rotX: number
  rotY: number
  rotZ: number
}

interface GameplayCameraPoseOptions {
  isProductionCabinet: boolean
  cabinetCamera: CabinetCameraSettings
}

const getDefaultCameraQuaternion = (position: Vector3): Quaternion => {
  const cameraRig = new Object3D()
  cameraRig.position.copy(position)
  cameraRig.lookAt(0, 0, 0)
  return cameraRig.quaternion.clone()
}

export const getGameplayCameraPose = ({
  isProductionCabinet,
  cabinetCamera,
}: GameplayCameraPoseOptions): CameraPose => {
  if (isProductionCabinet) {
    return {
      position: new Vector3(cabinetCamera.posX, cabinetCamera.posY, cabinetCamera.posZ),
      quaternion: new Quaternion().setFromEuler(
        new Euler(
          (cabinetCamera.rotX * Math.PI) / 180,
          (cabinetCamera.rotY * Math.PI) / 180,
          (cabinetCamera.rotZ * Math.PI) / 180,
        ),
      ),
      fov: cabinetCamera.fov,
    }
  }

  const position = new Vector3(...DEFAULT_CAMERA.position)

  return {
    position,
    quaternion: getDefaultCameraQuaternion(position),
    fov: DEFAULT_CAMERA.fov,
  }
}
