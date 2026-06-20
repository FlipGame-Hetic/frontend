import { getCurrentBallColorSnapshot } from "@/config/characterColors"

export const hasBallId = (value: unknown): value is { ballId: string } => {
  return (
    typeof value === "object" &&
    value !== null &&
    "ballId" in value &&
    typeof (value as Record<string, unknown>).ballId === "string"
  )
}

export const getBallId = (value: unknown): string | undefined => {
  if (!hasBallId(value)) return undefined
  return value.ballId
}

export const getCurrentBallColor = (): string => getCurrentBallColorSnapshot()
