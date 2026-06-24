// 'value is { ballId: string }' is a type guard : when this returns true, TypeScript narrows value to an object that has a string ballId
export const hasBallId = (value: unknown): value is { ballId: string } => {
  return (
    typeof value === "object" &&
    value !== null &&
    // There is a 'ballId' in userData prop
    "ballId" in value &&
    // The ballId's type is a string : we know for sure there is a valid ballId
    typeof (value as Record<string, unknown>).ballId === "string"
  )
}

// Returns the ball id when present, undefined otherwise, the guard above lets us read value.ballId safely here
export const getBallId = (value: unknown): string | undefined => {
  if (!hasBallId(value)) return undefined
  return value.ballId
}
