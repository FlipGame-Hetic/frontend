import type { Vector3Tuple } from "three"

export const DEFAULT_CAMERA: { position: Vector3Tuple; fov: number } = {
  position: [0, 13, 15],
  fov: 35,
}

export const CABINET_CAMERA = {
  fov: 36,
  posX: 0,
  posY: 18.3,
  posZ: 13.7,
  rotX: -52,
  rotY: 0,
  rotZ: 0,
}

export const DEMO_IDLE_DELAY_SECONDS = 8
export const DEMO_TRANSITION_DURATION_SECONDS = 1.5
export const CAMERA_DIRECTOR_FRAME_PRIORITY = -10
