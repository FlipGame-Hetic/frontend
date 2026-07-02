import type { Position3Type } from "@/types/worldTypes"
import type { Vector3Tuple } from "three"

// Playfield is tilted forward (z = 0.21, approx. 12deg), so its up-normal leans toward the camera, this vector is the game's real "up", not world Y
const PLAYFIELD_NORMAL: Vector3Tuple = [0, 1, 0.21]

const normalLength = Math.hypot(PLAYFIELD_NORMAL[0], PLAYFIELD_NORMAL[1], PLAYFIELD_NORMAL[2])

export const PLAYFIELD_UNIT_NORMAL: Position3Type = {
  x: PLAYFIELD_NORMAL[0] / normalLength,
  y: PLAYFIELD_NORMAL[1] / normalLength,
  z: PLAYFIELD_NORMAL[2] / normalLength,
}

// True down direction taking the playfield's tilt into account
export const PLAYFIELD_DOWN: Position3Type = {
  x: -PLAYFIELD_UNIT_NORMAL.x,
  y: -PLAYFIELD_UNIT_NORMAL.y,
  z: -PLAYFIELD_UNIT_NORMAL.z,
}

// Signed speed of a vector along the playfield normal : how fast it leaves (+) or enters (-) the plane
export const dotPlayfieldNormal = (vector: Position3Type) => {
  return (
    vector.x * PLAYFIELD_UNIT_NORMAL.x +
    vector.y * PLAYFIELD_UNIT_NORMAL.y +
    vector.z * PLAYFIELD_UNIT_NORMAL.z
  )
}

// Out-param variant : same math writing into out, so hot paths can avoid allocating
export const projectOnPlayfieldInto = (
  vector: Position3Type,
  out: Position3Type,
): Position3Type => {
  const normalSpeed = dotPlayfieldNormal(vector)

  out.x = vector.x - PLAYFIELD_UNIT_NORMAL.x * normalSpeed
  out.y = vector.y - PLAYFIELD_UNIT_NORMAL.y * normalSpeed
  out.z = vector.z - PLAYFIELD_UNIT_NORMAL.z * normalSpeed
  return out
}

// Drops the normal speed, keeping only the part of the velocity that slides along the tilted surface
export const projectOnPlayfield = (vector: Position3Type): Position3Type => {
  return projectOnPlayfieldInto(vector, { x: 0, y: 0, z: 0 })
}

// Direction in-plane of a vector, taking into account the tilt of the playfield
export const normalizedPlayfieldDirection = (vector: Position3Type): Position3Type | null => {
  const projected = projectOnPlayfield(vector)
  const length = Math.hypot(projected.x, projected.y, projected.z)

  // Null when the length is too short (prevents division by 0)
  if (length < 0.001) return null

  return {
    x: projected.x / length,
    y: projected.y / length,
    z: projected.z / length,
  }
}

// Out-param variant : same math writing into out, so hot paths can avoid allocating
export const clampVelocityToPlayfieldInto = (
  velocity: Position3Type,
  maxTangentSpeed: number,
  minNormalSpeed: number,
  maxNormalSpeed: number,
  out: Position3Type,
): Position3Type => {
  const normalSpeed = Math.min(
    maxNormalSpeed,
    Math.max(minNormalSpeed, dotPlayfieldNormal(velocity)),
  )
  const tangentVelocity = projectOnPlayfield(velocity)
  const tangentSpeed = Math.hypot(tangentVelocity.x, tangentVelocity.y, tangentVelocity.z)
  const tangentRatio =
    tangentSpeed > maxTangentSpeed && tangentSpeed > 0 ? maxTangentSpeed / tangentSpeed : 1

  out.x = tangentVelocity.x * tangentRatio + PLAYFIELD_UNIT_NORMAL.x * normalSpeed
  out.y = tangentVelocity.y * tangentRatio + PLAYFIELD_UNIT_NORMAL.y * normalSpeed
  out.z = tangentVelocity.z * tangentRatio + PLAYFIELD_UNIT_NORMAL.z * normalSpeed
  return out
}

export const clampVelocityToPlayfield = (
  velocity: Position3Type,
  maxTangentSpeed: number,
  minNormalSpeed: number,
  maxNormalSpeed: number,
): Position3Type => {
  return clampVelocityToPlayfieldInto(velocity, maxTangentSpeed, minNormalSpeed, maxNormalSpeed, {
    x: 0,
    y: 0,
    z: 0,
  })
}

export const clampBallVelocityToPlayfield = (
  velocity: Position3Type,
  maxTangentSpeed: number,
  minNormalSpeed: number,
  maxNormalSpeed: number,
): Position3Type => {
  return clampVelocityToPlayfield(
    velocity,
    maxTangentSpeed,
    minNormalSpeed,
    // Forces maxNormalSpeed <= 0 so a bumper or slingshot kick can never push the ball up off the tilted playfield
    Math.min(0, maxNormalSpeed),
  )
}

// Out-param variant : same math writing into out, so hot paths can avoid allocating
export const clampNormalToPlayfieldInto = (
  velocity: Position3Type,
  minNormalSpeed: number,
  maxNormalSpeed: number,
  out: Position3Type,
): Position3Type => {
  const normalSpeed = Math.min(
    maxNormalSpeed,
    Math.max(minNormalSpeed, dotPlayfieldNormal(velocity)),
  )
  const tangentVelocity = projectOnPlayfield(velocity)
  out.x = tangentVelocity.x + PLAYFIELD_UNIT_NORMAL.x * normalSpeed
  out.y = tangentVelocity.y + PLAYFIELD_UNIT_NORMAL.y * normalSpeed
  out.z = tangentVelocity.z + PLAYFIELD_UNIT_NORMAL.z * normalSpeed
  return out
}

export const clampNormalToPlayfield = (
  velocity: Position3Type,
  minNormalSpeed: number,
  maxNormalSpeed: number,
): Position3Type => {
  return clampNormalToPlayfieldInto(velocity, minNormalSpeed, maxNormalSpeed, { x: 0, y: 0, z: 0 })
}
