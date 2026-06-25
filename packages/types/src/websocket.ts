export type ConnectionStatus = "disconnected" | "connecting" | "connected"

// General type, accepts any message, including unknown future types
export interface GameMessage {
  dir: "inbound" | "outbound"
  device_id: string
  _type: string
  [key: string]: unknown
}
