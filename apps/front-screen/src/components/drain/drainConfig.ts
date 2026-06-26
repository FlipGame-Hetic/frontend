import type { Vector3Tuple } from "three"

// Middle extent thickens the catch band along the downhill axis so a fast ball is far less likely to tunnel the sensor in a single physics step
export const DRAIN_SENSOR_HALF_EXTENTS: Vector3Tuple = [3.2, 0.5, 0.6]
export const DRAIN_SENSOR_POSITION: Vector3Tuple = [-0.3, 0, 7.5]
export const DRAIN_RESPAWN_DELAY_MS = 1000
// Far below the table : a ball past this Y has tunneled the drain sensor and is force-killed
export const DRAIN_SAFETY_FALLBACK_Y = -10
