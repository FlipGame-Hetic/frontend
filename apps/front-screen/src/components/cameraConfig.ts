import { Euler, Object3D, Quaternion, Vector3, type Vector3Tuple } from "three"

export const DEFAULT_CAMERA: { position: Vector3Tuple; fov: number } = {
  position: [0, 13, 15],
  fov: 35,
}

export const CABINET_CAMERA = {
  fov: 38,
  posX: 0,
  posY: 18.3,
  posZ: 13.6,
  rotX: -52,
  rotY: 0,
  rotZ: 0,
}

export const DEMO_IDLE_DELAY_SECONDS = 8
export const DEMO_TRANSITION_DURATION_SECONDS = 1.5
export const CAMERA_DIRECTOR_FRAME_PRIORITY = -10

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
