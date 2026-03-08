import { useEffect, useRef } from "react"
import type { GameMessage } from "@frontend/types"

export interface LogEntry {
  id: number
  timestamp: Date
  message: GameMessage
}

function getTypeColor(type: string): string {
  switch (type) {
    case "Button":
    case "Plunger":
    case "BallHit":
      return "text-neon-pink"
    case "Gyro":
    case "Command":
      return "text-neon-purple"
    case "Telemetry":
    case "Status":
    case "GameState":
      return "text-neon-cyan"
    case "Event":
      return "text-neon-yellow"
    default:
      return "text-white/70"
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    fractionalSecondDigits: 3,
  })
}

function LogLine({ entry }: { entry: LogEntry }) {
  const { message, timestamp } = entry
  const dirLabel = message.dir === "inbound" ? "IN " : "OUT"
  const dirColor = message.dir === "inbound" ? "text-neon-cyan" : "text-neon-yellow"
  const typeColor = getTypeColor(message._type)

  const { dir: _d, device_id: _did, _type, ...rest } = message
  const payload = JSON.stringify(rest)

  return (
    <div className="flex gap-2 px-2 font-mono text-xs leading-5 hover:bg-white/5">
      <span className="shrink-0 text-white/30">{formatTime(timestamp)}</span>
      <span className={`${dirColor} shrink-0 font-bold`}>{dirLabel}</span>
      <span className="shrink-0 text-white/40">{message.device_id}</span>
      <span className={`${typeColor} shrink-0 font-bold`}>{_type}</span>
      <span className="truncate text-white/60">{payload}</span>
    </div>
  )
}

interface TerminalLogProps {
  logs: LogEntry[]
}

export function TerminalLog({ logs }: TerminalLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [logs.length])

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto py-1">
      {logs.map((entry) => (
        <LogLine key={entry.id} entry={entry} />
      ))}
      {logs.length === 0 && (
        <div className="px-2 py-4 font-mono text-xs text-white/20">Waiting for messages...</div>
      )}
    </div>
  )
}
