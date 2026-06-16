import type { PositionType } from "@/types/worldTypes"

export const RAIL_BASE_ACCEL = 0.5
export const RAIL_BOOST_PER_SECOND = 0.05
export const RAIL_MAX_ACCEL = 0.4
export const RAIL_MIN_VEL = 0.2

export interface RailSensorConfig {
  halfExtents: PositionType
  id: string
  position: PositionType
  rotation?: PositionType
  source: string
}

export const RAIL_ENTRY_SENSORS: RailSensorConfig[] = [
  {
    id: "rail-right-entrance",
    source: "sensor-rail-right-entrance",
    position: [1.35, 1.45, -3.1],
    halfExtents: [0.15, 0.2, 0.2],
  },
  {
    id: "rail-left-entrance",
    source: "sensor-rail-left-entrance",
    position: [-1.85, 1.7, -3.3],
    halfExtents: [0.15, 0.2, 0.2],
  },
  {
    id: "top-tunnel-entrance",
    source: "sensor-top-tunnel-entrance",
    position: [3.15, 1.75, -4.5],
    halfExtents: [0.15, 0.2, 0.2],
  },
]

export const RAIL_EXIT_SENSORS: RailSensorConfig[] = [
  {
    id: "bottom-left-rail-exit",
    source: "sensor-bottom-left-rail-exit",
    position: [-2.67, 0.8, 3],
    halfExtents: [0.15, 0.2, 0.2],
  },
  {
    id: "bottom-right-rail-exit",
    source: "sensor-bottom-right-rail-exit",
    position: [2, 1, 3],
    halfExtents: [0.15, 0.2, 0.2],
  },
  {
    id: "top-tunnel-exit",
    source: "sensor-top-tunnel-exit",
    position: [-3.4, 1, 1.4],
    halfExtents: [0.15, 0.2, 0.2],
  },
]
