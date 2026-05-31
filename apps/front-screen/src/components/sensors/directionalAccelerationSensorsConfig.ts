import type { PositionType } from "@/types/worldTypes"

export interface DirectionalAccelerationSensorConfig {
  id: string
  sensorHalfExtents: PositionType
  sensorPosition: PositionType
  sensorRotation?: PositionType
  direction: PositionType
  acceleration: number
  maxSpeed?: number
}

export const GUTTER_DRAIN_ASSIST_SENSORS: DirectionalAccelerationSensorConfig[] = [
  {
    id: "left-gutter-drain-assist",
    sensorHalfExtents: [0.5, 0.35, 1.5],
    sensorPosition: [-2.45, -0.15, 5.9],
    sensorRotation: [0, 1.1, 0],
    direction: [1, 0, 1],
    acceleration: 10,
    maxSpeed: 10,
  },
  {
    id: "right-gutter-drain-assist",
    sensorHalfExtents: [0.3, 0.35, 1.4],
    sensorPosition: [1.7, -0.15, 5.8],
    sensorRotation: [0, -1.1, 0],
    direction: [-1, 0, 1],
    acceleration: 10,
    maxSpeed: 10,
  },
]
