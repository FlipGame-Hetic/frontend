interface Position {
  x: number
  y: number
  z: number
}

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

export const getAnyBallPosition = (): Position | undefined => {
  const first = positions.values().next()
  return first.done ? undefined : first.value
}
