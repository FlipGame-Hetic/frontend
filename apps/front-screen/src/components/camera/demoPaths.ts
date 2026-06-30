import { CatmullRomCurve3, Vector3, type Vector3Tuple } from "three"

export interface DemoCameraPath {
  id: string
  durationSeconds: number
  positionCurve: CatmullRomCurve3
  lookAtCurve: CatmullRomCurve3
  rollDegrees: number[]
  positionPoints: Vector3[]
  lookAtPoints: Vector3[]
}

export interface DemoCameraSample {
  position: Vector3
  lookAt: Vector3
  rollRadians: number
}

const toVectorPoints = (points: Vector3Tuple[]): Vector3[] =>
  points.map(([x, y, z]) => new Vector3(x, y, z))

const createDemoCameraPath = ({
  id,
  durationSeconds,
  positions,
  lookAts,
  rollDegrees,
}: {
  id: string
  durationSeconds: number
  positions: Vector3Tuple[]
  lookAts: Vector3Tuple[]
  rollDegrees: number[]
}): DemoCameraPath => {
  const positionPoints = toVectorPoints(positions)
  const lookAtPoints = toVectorPoints(lookAts)

  return {
    id,
    durationSeconds,
    positionCurve: new CatmullRomCurve3(positionPoints, false, "centripetal", 0.5),
    lookAtCurve: new CatmullRomCurve3(lookAtPoints, false, "centripetal", 0.5),
    rollDegrees,
    positionPoints,
    lookAtPoints,
  }
}

const sampleScalarKeyframes = (values: number[], t: number): number => {
  const firstValue = values[0]
  if (firstValue === undefined) return 0
  if (values.length === 1) return firstValue

  const clampedT = Math.min(1, Math.max(0, t))
  const scaledIndex = clampedT * (values.length - 1)
  const lowerIndex = Math.floor(scaledIndex)
  const upperIndex = Math.min(values.length - 1, lowerIndex + 1)
  const lowerValue = values[lowerIndex] ?? firstValue
  const upperValue = values[upperIndex] ?? lowerValue

  return lowerValue + (upperValue - lowerValue) * (scaledIndex - lowerIndex)
}

export const DEMO_CAMERA_PATHS: DemoCameraPath[] = [
  createDemoCameraPath({
    id: "center-floor-climb",
    durationSeconds: 12,
    positions: [
      [0, 2.3, 7.4],
      [0, 2.45, 4.8],
      [0, 2.65, 1.7],
      [0, 2.9, -1.8],
      [0, 3.15, -4.7],
    ],
    lookAts: [
      [0, 1.15, 4.15],
      [0, 1.32, 1.75],
      [0, 1.55, -1.15],
      [0, 1.75, -4],
      [0, 1.95, -5.8],
    ],
    rollDegrees: [0, -1.5, 0, 1.5, 0],
  }),
  createDemoCameraPath({
    id: "bumper-orbit",
    durationSeconds: 12,
    positions: [
      [-2.6, 3.2, 0.8],
      [-1.4, 3.6, -1.2],
      [0.35, 3.85, -2.4],
      [2.1, 3.55, -1.1],
      [2.5, 3.2, 1.3],
    ],
    lookAts: [
      [-0.75, 1.25, 0.35],
      [-0.3, 1.45, -1.25],
      [0.35, 1.65, -2.25],
      [0.95, 1.45, -0.95],
      [0.5, 1.25, 0.95],
    ],
    rollDegrees: [-7, -4, 0, 5, 7],
  }),
  createDemoCameraPath({
    id: "plunger-sweep",
    durationSeconds: 11,
    positions: [
      [3.25, 2.55, 7.5],
      [3.15, 2.65, 4.7],
      [2.95, 2.9, 1.8],
      [2.45, 3.25, -1.4],
      [1.2, 3.35, -3.8],
    ],
    lookAts: [
      [3.45, 1.1, 4.95],
      [3.35, 1.25, 2.25],
      [3, 1.45, -0.55],
      [2.15, 1.62, -2.9],
      [0.35, 1.75, -5],
    ],
    rollDegrees: [-4, -3, -1, 2, 5],
  }),
  createDemoCameraPath({
    id: "side-rail-sweep",
    durationSeconds: 13,
    positions: [
      [-3.05, 3.25, 4.2],
      [-2.7, 3.45, 1.5],
      [-2.15, 3.75, -1.9],
      [-0.65, 4.05, -4.2],
      [1.5, 3.6, -4.6],
    ],
    lookAts: [
      [-1.25, 1.15, 3.2],
      [-1.05, 1.35, 0.55],
      [-0.65, 1.55, -2.35],
      [0.1, 1.8, -5.05],
      [1.35, 1.65, -4.35],
    ],
    rollDegrees: [7, 5, 1, -4, -7],
  }),
]

export const getDemoCameraPath = (index: number): DemoCameraPath => {
  const fallback = DEMO_CAMERA_PATHS[0]
  if (!fallback) throw new Error("At least one demo camera path is required")

  const clampedIndex = Math.min(DEMO_CAMERA_PATHS.length - 1, Math.max(0, Math.round(index)))
  return DEMO_CAMERA_PATHS[clampedIndex] ?? fallback
}

export const sampleDemoCameraPath = (path: DemoCameraPath, t: number): DemoCameraSample => {
  const clampedT = Math.min(1, Math.max(0, t))

  return {
    position: path.positionCurve.getPoint(clampedT),
    lookAt: path.lookAtCurve.getPoint(clampedT),
    rollRadians: (sampleScalarKeyframes(path.rollDegrees, clampedT) * Math.PI) / 180,
  }
}
