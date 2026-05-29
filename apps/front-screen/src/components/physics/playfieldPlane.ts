import type { Vector3Tuple } from "three"

export interface VectorLike {
  x: number
  y: number
  z: number
}

export const PLAYFIELD_NORMAL: Vector3Tuple = [0, 1, 0.21]

const normalLength = Math.hypot(PLAYFIELD_NORMAL[0], PLAYFIELD_NORMAL[1], PLAYFIELD_NORMAL[2])

export const PLAYFIELD_UNIT_NORMAL: VectorLike = {
  x: PLAYFIELD_NORMAL[0] / normalLength,
  y: PLAYFIELD_NORMAL[1] / normalLength,
  z: PLAYFIELD_NORMAL[2] / normalLength,
}

export const dotPlayfieldNormal = (vector: VectorLike) => {
  return (
    vector.x * PLAYFIELD_UNIT_NORMAL.x +
    vector.y * PLAYFIELD_UNIT_NORMAL.y +
    vector.z * PLAYFIELD_UNIT_NORMAL.z
  )
}

export const projectOnPlayfield = (vector: VectorLike): VectorLike => {
  const normalSpeed = dotPlayfieldNormal(vector)

  return {
    x: vector.x - PLAYFIELD_UNIT_NORMAL.x * normalSpeed,
    y: vector.y - PLAYFIELD_UNIT_NORMAL.y * normalSpeed,
    z: vector.z - PLAYFIELD_UNIT_NORMAL.z * normalSpeed,
  }
}

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

export const normalizedPlanarBounceDirection = (vector: VectorLike): VectorLike | null => {
  const length = Math.hypot(vector.x, vector.z)

  if (length < 0.001) return null

  return {
    x: vector.x / length,
    y: 0,
    z: vector.z / length,
  }
}

export const removePositiveVerticalVelocity = (velocity: VectorLike): VectorLike => {
  return {
    x: velocity.x,
    y: Math.min(0, velocity.y),
    z: velocity.z,
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
    Math.min(0, maxNormalSpeed),
  )
}
