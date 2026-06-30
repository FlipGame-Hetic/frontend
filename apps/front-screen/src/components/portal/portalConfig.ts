import type { PositionType } from "@/types/worldTypes"
import { Euler, Matrix4, Vector3 } from "three"
import { BALL_RADIUS } from "../balls/ballConfig"
import { toVector3 } from "../physics/physicsConfig"

export type PortalId = "A" | "B"

export const PORTAL_A_POSITION: PositionType = [-2.73, 1.7, -4.285]
export const PORTAL_A_ROTATION: PositionType = [-0.1, 0.28, 0]

export const PORTAL_B_POSITION: PositionType = [2.2, 1.8, -4.28]
export const PORTAL_B_ROTATION: PositionType = [-0, -0.17, 0]

export const PORTAL_SENSOR_HALF_EXTENTS: PositionType = [0.3, 0.3, 0.5]

export const PORTAL_SIZE: Record<PortalId, number> = {
  A: 0.9,
  B: 1.16,
}

export const PORTAL_SWAP_THRESHOLD_Z = PORTAL_SENSOR_HALF_EXTENTS[2] - BALL_RADIUS
export const PORTAL_REENTRY_COOLDOWN_MS = 200

const FLIP = new Matrix4().set(-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1)

const buildPortalMatrix = (position: PositionType, rotation: PositionType): Matrix4 => {
  const mat = new Matrix4()
  mat.makeRotationFromEuler(new Euler(rotation[0], rotation[1], rotation[2]))
  mat.setPosition(toVector3(position))
  return mat
}

const getTransform = (from: PortalId): Matrix4 => {
  const [fromPos, fromRot, toPos, toRot] =
    from === "A"
      ? [PORTAL_A_POSITION, PORTAL_A_ROTATION, PORTAL_B_POSITION, PORTAL_B_ROTATION]
      : [PORTAL_B_POSITION, PORTAL_B_ROTATION, PORTAL_A_POSITION, PORTAL_A_ROTATION]

  const matFrom = buildPortalMatrix(fromPos, fromRot)
  const matTo = buildPortalMatrix(toPos, toRot)
  return matTo.clone().multiply(FLIP).multiply(matFrom.clone().invert())
}

const getGhostTransform = (from: PortalId): Matrix4 => {
  const halfZ = PORTAL_SENSOR_HALF_EXTENTS[2]
  const ghostFlip = new Matrix4().set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 2 * halfZ, 0, 0, 0, 1)
  const [fromPos, fromRot, toPos, toRot] =
    from === "A"
      ? [PORTAL_A_POSITION, PORTAL_A_ROTATION, PORTAL_B_POSITION, PORTAL_B_ROTATION]
      : [PORTAL_B_POSITION, PORTAL_B_ROTATION, PORTAL_A_POSITION, PORTAL_A_ROTATION]
  const matFrom = buildPortalMatrix(fromPos, fromRot)
  const matTo = buildPortalMatrix(toPos, toRot)
  return matTo.clone().multiply(ghostFlip).multiply(matFrom.clone().invert())
}

export const ghostPositionThroughPortal = (fromPortal: PortalId, pos: Vector3): Vector3 => {
  return pos.clone().applyMatrix4(getGhostTransform(fromPortal))
}

export const getPortalFrontFacePosition = (id: PortalId): PositionType => {
  const pos = getPortalPosition(id)
  const normal = getPortalNormal(id)
  const halfZ = PORTAL_SENSOR_HALF_EXTENTS[2]
  return [pos[0] + normal.x * halfZ, pos[1] + normal.y * halfZ, pos[2] + normal.z * halfZ]
}

export const transformThroughPortal = (
  fromPortal: PortalId,
  pos: Vector3,
  vel: Vector3,
): { pos: Vector3; vel: Vector3 } => {
  const T = getTransform(fromPortal)
  const newPos = pos.clone().applyMatrix4(T)
  const newVel = new Vector3(-vel.x, vel.y, -vel.z)
  return { pos: newPos, vel: newVel }
}

export const getPortalNormal = (id: PortalId): Vector3 => {
  const rot = id === "A" ? PORTAL_A_ROTATION : PORTAL_B_ROTATION
  return new Vector3(0, 0, 1).applyEuler(new Euler(rot[0], rot[1], rot[2]))
}

export const getPortalPosition = (id: PortalId): PositionType => {
  return id === "A" ? PORTAL_A_POSITION : PORTAL_B_POSITION
}

export const getPortalRotation = (id: PortalId): PositionType => {
  return id === "A" ? PORTAL_A_ROTATION : PORTAL_B_ROTATION
}

export const oppositePortal = (id: PortalId): PortalId => {
  return id === "A" ? "B" : "A"
}
