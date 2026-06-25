import { Euler, Vector3 } from "three"
import type { VectorLike } from "../playfieldPlane"
import { SNAP_EXEMPT_ZONES } from "./snapExemptZonesConfig"

const localPoint = new Vector3()
const euler = new Euler()

export const isPointInSnapExemptZone = (point: VectorLike): boolean => {
  for (const zone of SNAP_EXEMPT_ZONES) {
    localPoint.set(
      point.x - zone.position[0],
      point.y - zone.position[1],
      point.z - zone.position[2],
    )
    // The exempt zone may be rotated, so we make testing easier by moving the localPoint relatively to the zone center to align its axis before comparing
    euler.set(-zone.rotation[0], -zone.rotation[1], -zone.rotation[2], "XYZ")
    localPoint.applyEuler(euler)

    if (
      Math.abs(localPoint.x) <= zone.halfExtents[0] &&
      Math.abs(localPoint.y) <= zone.halfExtents[1] &&
      Math.abs(localPoint.z) <= zone.halfExtents[2]
    ) {
      return true
    }
  }

  return false
}
