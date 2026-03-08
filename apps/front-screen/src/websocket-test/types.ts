export type Color = "cyan" | "magenta" | "green" | "red" | "yellow" | "purple"

export interface LogEntry {
  id: number
  type: string
  payload: unknown
  time: string
}

export type Dispatcher = (type: string, payload?: unknown) => void
