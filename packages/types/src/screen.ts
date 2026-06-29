// Status of connection to WebSocket
export type ConnectionStatus = "disconnected" | "connecting" | "connected"

// Possible sources for a webSocket event (game_engine is not used but may happen with the physical cabinet, and is kept for documentation and contract purposes)
export type ScreenId = "front_screen" | "back_screen" | "dmd_screen"
type ScreenSource = ScreenId | "backend" | "game_engine"

// A webSocket event is either sent to one screen in particular or broadcasted among all three screens, the backend is used as a router
export type ScreenTarget = { kind: "screen"; id: ScreenId } | { kind: "broadcast" }

export interface ScreenEnvelope {
  from: ScreenSource
  to: ScreenTarget
  event_type: string
  payload: unknown
}
