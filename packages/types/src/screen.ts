export type ScreenId = "front_screen" | "back_screen" | "dmd_screen"

export type ScreenTarget = { kind: "screen"; id: ScreenId } | { kind: "broadcast" }

export interface ScreenEnvelope {
  from: ScreenId
  to: ScreenTarget
  event_type: string
  payload: unknown
}
