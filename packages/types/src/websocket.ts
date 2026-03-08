// WebSocket types

export type ConnectionStatus = "disconnected" | "connecting" | "connected"

// General type, accepts any message, including unknown future types
export interface GameMessage {
  dir: "inbound" | "outbound"
  device_id: string
  _type: string
  [key: string]: unknown
}

// Inbound payloads (From IoT)

export interface ButtonPayload {
  _type: "Button"
  id: string
  state: number
  ts: number
}

export interface PlungerPayload {
  _type: "Plunger"
  position: number
  released: boolean
  ts: number
}

export interface GyroPayload {
  _type: "Gyro"
  ax: number
  ay: number
  az: number
  tilt: boolean
}

export interface TelemetryPayload {
  _type: "Telemetry"
  wifi_rssi: number
  uptime_s: number
  loop_freq_hz: number
  free_heap: number
  mqtt_reconnects: number
}

export interface DeviceEventPayload {
  _type: "Event"
  event: string
  fw_version: string
  reason: string
  ts: number
}

export interface DeviceStatusPayload {
  _type: "Status"
  online: boolean
  fw_version: string
  ip: string
  free_heap: number
  vibrators_ok: boolean[]
  gyro_ok: boolean
}

// Outbound payloads (From web client)

export interface BallHitPayload {
  _type: "BallHit"
  hits: { id: string; type: string; force: number }[]
}

export interface GameStatePayload {
  _type: "GameState"
  state: string
  ball_number: number
  score: number
  player: number
  total_players: number
}

export interface CommandPayload {
  _type: "Command"
  cmd: string
  params: Record<string, unknown>
}

// Union of all typed payloads — use for exhaustive switch/case
export type GamePayload =
  | ButtonPayload
  | PlungerPayload
  | GyroPayload
  | TelemetryPayload
  | DeviceEventPayload
  | DeviceStatusPayload
  | BallHitPayload
  | GameStatePayload
  | CommandPayload
