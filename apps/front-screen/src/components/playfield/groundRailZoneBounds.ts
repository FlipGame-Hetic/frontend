import { Euler, Vector3 } from "three"
import {
  GROUND_RAIL_ZONE_HALF_EXTENTS,
  GROUND_RAIL_ZONE_POSITION,
  GROUND_RAIL_ZONE_ROTATION,
} from "./groundRailZoneConfig"

const localPoint = new Vector3()
const euler = new Euler()

export const isPointInGroundRailZone = (point: { x: number; y: number; z: number }): boolean => {
  localPoint.set(
    point.x - GROUND_RAIL_ZONE_POSITION[0],
    point.y - GROUND_RAIL_ZONE_POSITION[1],
    point.z - GROUND_RAIL_ZONE_POSITION[2],
  )
  euler.set(
    -GROUND_RAIL_ZONE_ROTATION[0],
    -GROUND_RAIL_ZONE_ROTATION[1],
    -GROUND_RAIL_ZONE_ROTATION[2],
    "XYZ",
  )
  localPoint.applyEuler(euler)

  return (
    Math.abs(localPoint.x) <= GROUND_RAIL_ZONE_HALF_EXTENTS[0] &&
    Math.abs(localPoint.y) <= GROUND_RAIL_ZONE_HALF_EXTENTS[1] &&
    Math.abs(localPoint.z) <= GROUND_RAIL_ZONE_HALF_EXTENTS[2]
  )
}
