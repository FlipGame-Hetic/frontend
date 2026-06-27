interface Position {
  x: number
  y: number
  z: number
}

// Latest position of each live ball, written every frame by Ball and read by off-React code (score popups, portals) without re-rendering
const positions = new Map<string, Position>()

export const setBallPosition = (id: string, position: Position): void => {
  positions.set(id, position)
}

export const removeBallPosition = (id: string): void => {
  positions.delete(id)
}

export const getBallPosition = (id: string): Position | undefined => {
  return positions.get(id)
}

// Any live ball's position, a fallback when a specific ball id can't be resolved
export const getAnyBallPosition = (): Position | undefined => {
  const firstElement = positions.values().next()
  // '.done' is true if this element is after the last of the map, so if it is true then the map was empty
  return firstElement.done ? undefined : firstElement.value
}

export interface BallPositionEntry extends Position {
  id: string
}

// Immutable snapshot of every live ball's position, so callers don't read the internal mutable map directly
export const getBallPositionEntries = (): BallPositionEntry[] => {
  return Array.from(positions, ([id, p]) => ({ id, x: p.x, y: p.y, z: p.z }))
}
