export const hasBallId = (value: unknown): value is { ballId: string } => {
  return (
    typeof value === "object" &&
    value !== null &&
    "ballId" in value &&
    typeof value.ballId === "string"
  )
}
