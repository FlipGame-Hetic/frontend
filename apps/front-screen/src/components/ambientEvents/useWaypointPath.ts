import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import type { RefObject } from "react"
import { Vector3, type Group } from "three"
import type { Waypoint } from "./ambientEventsConfig"

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

interface PathSample {
  position: [number, number, number]
  tangent: [number, number, number]
}

// Uniform sampling across the polyline : t in [0,1] maps to one segment of the path
const samplePath = (waypoints: readonly Waypoint[], t: number): PathSample => {
  const segmentCount = waypoints.length - 1
  const scaled = Math.min(Math.max(t, 0), 1) * segmentCount
  const index = Math.min(Math.floor(scaled), segmentCount - 1)
  const localT = scaled - index
  const a = waypoints[index]
  const b = waypoints[index + 1]
  if (!a || !b) return { position: [0, 0, 0], tangent: [0, 0, 0] }

  return {
    position: [lerp(a[0], b[0], localT), lerp(a[1], b[1], localT), lerp(a[2], b[2], localT)],
    tangent: [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
  }
}

// Reused across frames to avoid allocating a Vector3 every tick
const lookTarget = new Vector3()

// Drives a group along a waypoint path over durationMs, then fires onComplete once so the atom can remove itself
const useWaypointPath = (
  groupRef: RefObject<Group | null>,
  waypoints: readonly Waypoint[],
  durationMs: number,
  easing: (t: number) => number,
  orientToPath: boolean,
  onComplete: () => void,
): void => {
  const startRef = useRef<number | null>(null)
  const doneRef = useRef(false)

  useFrame(() => {
    const group = groupRef.current
    if (!group || doneRef.current) return
    startRef.current ??= performance.now()

    const progress = (performance.now() - startRef.current) / durationMs
    if (progress >= 1) {
      doneRef.current = true
      onComplete()
      return
    }

    const { position, tangent } = samplePath(waypoints, easing(progress))
    group.position.set(position[0], position[1], position[2])

    if (orientToPath) {
      lookTarget.set(position[0] + tangent[0], position[1] + tangent[1], position[2] + tangent[2])
      group.lookAt(lookTarget)
    }
  })
}

export default useWaypointPath
