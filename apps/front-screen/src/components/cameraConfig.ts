import type { Vector3Tuple } from "three"

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
