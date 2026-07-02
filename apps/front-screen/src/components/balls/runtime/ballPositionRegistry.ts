import type { Position3Type } from "@/types/worldTypes"

// Latest position of each live ball, written every frame by Ball and read by off-React code (score popups, portals) without re-rendering
const positions = new Map<string, Position3Type>()

// Write in place : the stored object is mutated every frame to avoid a per-frame allocation, created only on the first set for this id
export const setBallPosition = (id: string, x: number, y: number, z: number): void => {
  const stored = positions.get(id)
  if (stored) {
    stored.x = x
    stored.y = y
    stored.z = z
    return
  }
  positions.set(id, { x, y, z })
}

export const removeBallPosition = (id: string): void => {
  positions.delete(id)
}

// Copy on read : callers (score popups) retain the returned object for a 1.2s animation, so it must not alias the live, mutated store entry
export const getBallPosition = (id: string): Position3Type | undefined => {
  const stored = positions.get(id)
  return stored ? { x: stored.x, y: stored.y, z: stored.z } : undefined
}

// Any live ball's position, a fallback when a specific ball id can't be resolved
export const getAnyBallPosition = (): Position3Type | undefined => {
  const firstElement = positions.values().next()
  // '.done' is true if this element is after the last of the map, so if it is true then the map was empty
  if (firstElement.done) return undefined
  const stored = firstElement.value
  return { x: stored.x, y: stored.y, z: stored.z }
}

export interface BallPositionEntry extends Position3Type {
  id: string
}

// Immutable snapshot of every live ball's position, so callers don't read the internal mutable map directly
export const getBallPositionEntries = (): BallPositionEntry[] => {
  return Array.from(positions, ([id, p]) => ({ id, x: p.x, y: p.y, z: p.z }))
}
