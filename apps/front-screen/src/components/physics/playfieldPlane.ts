import type { Vector3Tuple } from "three"

export interface VectorLike {
  x: number
  y: number
  z: number
}

// Playfield is tilted forward (z = 0.21, approx. 12deg), so its up-normal leans toward the camera, this vector is the game's real "up", not world Y
const PLAYFIELD_NORMAL: Vector3Tuple = [0, 1, 0.21]

const normalLength = Math.hypot(PLAYFIELD_NORMAL[0], PLAYFIELD_NORMAL[1], PLAYFIELD_NORMAL[2])

export const PLAYFIELD_UNIT_NORMAL: VectorLike = {
  x: PLAYFIELD_NORMAL[0] / normalLength,
  y: PLAYFIELD_NORMAL[1] / normalLength,
  z: PLAYFIELD_NORMAL[2] / normalLength,
}

// True down direction taking the playfield's tilt into account
export const PLAYFIELD_DOWN: VectorLike = {
  x: -PLAYFIELD_UNIT_NORMAL.x,
  y: -PLAYFIELD_UNIT_NORMAL.y,
  z: -PLAYFIELD_UNIT_NORMAL.z,
}

// Signed speed of a vector along the playfield normal : how fast it leaves (+) or enters (-) the plane
export const dotPlayfieldNormal = (vector: VectorLike) => {
  return (
    vector.x * PLAYFIELD_UNIT_NORMAL.x +
    vector.y * PLAYFIELD_UNIT_NORMAL.y +
    vector.z * PLAYFIELD_UNIT_NORMAL.z
  )
}

// Drops the normal speed, keeping only the part of the velocity that slides along the tilted surface
export const projectOnPlayfield = (vector: VectorLike): VectorLike => {
  const normalSpeed = dotPlayfieldNormal(vector)

  return {
    x: vector.x - PLAYFIELD_UNIT_NORMAL.x * normalSpeed,
    y: vector.y - PLAYFIELD_UNIT_NORMAL.y * normalSpeed,
    z: vector.z - PLAYFIELD_UNIT_NORMAL.z * normalSpeed,
  }
}

// In-plane unit direction of a vector, null when nothing meaningful is left after projection (too short)
export const normalizedPlayfieldDirection = (vector: VectorLike): VectorLike | null => {
  const projected = projectOnPlayfield(vector)
  const length = Math.hypot(projected.x, projected.y, projected.z)

  if (length < 0.001) return null

  return {
    x: projected.x / length,
    y: projected.y / length,
    z: projected.z / length,
  }
}

export const clampVelocityToPlayfield = (
  velocity: VectorLike,
  maxTangentSpeed: number,
  minNormalSpeed: number,
  maxNormalSpeed: number,
): VectorLike => {
  const normalSpeed = Math.min(
    maxNormalSpeed,
    Math.max(minNormalSpeed, dotPlayfieldNormal(velocity)),
  )
  const tangentVelocity = projectOnPlayfield(velocity)
  const tangentSpeed = Math.hypot(tangentVelocity.x, tangentVelocity.y, tangentVelocity.z)
  const tangentRatio =
    tangentSpeed > maxTangentSpeed && tangentSpeed > 0 ? maxTangentSpeed / tangentSpeed : 1

  return {
    x: tangentVelocity.x * tangentRatio + PLAYFIELD_UNIT_NORMAL.x * normalSpeed,
    y: tangentVelocity.y * tangentRatio + PLAYFIELD_UNIT_NORMAL.y * normalSpeed,
    z: tangentVelocity.z * tangentRatio + PLAYFIELD_UNIT_NORMAL.z * normalSpeed,
  }
}

export const clampBallVelocityToPlayfield = (
  velocity: VectorLike,
  maxTangentSpeed: number,
  minNormalSpeed: number,
  maxNormalSpeed: number,
): VectorLike => {
  return clampVelocityToPlayfield(
    velocity,
    maxTangentSpeed,
    minNormalSpeed,
    // Forces maxNormalSpeed <= 0 so a bumper or slingshot kick can never push the ball up off the tilted playfield
    Math.min(0, maxNormalSpeed),
  )
}

export const clampNormalToPlayfield = (
  velocity: VectorLike,
  minNormalSpeed: number,
  maxNormalSpeed: number,
): VectorLike => {
  const normalSpeed = Math.min(
    maxNormalSpeed,
    Math.max(minNormalSpeed, dotPlayfieldNormal(velocity)),
  )
  const tangentVelocity = projectOnPlayfield(velocity)
  return {
    x: tangentVelocity.x + PLAYFIELD_UNIT_NORMAL.x * normalSpeed,
    y: tangentVelocity.y + PLAYFIELD_UNIT_NORMAL.y * normalSpeed,
    z: tangentVelocity.z + PLAYFIELD_UNIT_NORMAL.z * normalSpeed,
  }
}
