import type { ConnectionStatus } from "@frontend/types"

const STATUS_CONFIG: Record<ConnectionStatus, { dot: string; text: string }> = {
  connected: { dot: "bg-green-500", text: "Connected" },
  connecting: { dot: "bg-yellow-500 animate-pulse", text: "Connecting..." },
  disconnected: { dot: "bg-red-500", text: "Disconnected" },
}

interface StatusBarProps {
  status: ConnectionStatus
  messageCount: number
  onClear: () => void
}

export function StatusBar({ status, messageCount, onClear }: StatusBarProps) {
  const { dot, text } = STATUS_CONFIG[status]

  return (
    <div className="border-surface-border bg-surface-card flex items-center justify-between border-b px-3 py-1.5 font-mono text-xs">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-white/60">{text}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-white/30">{messageCount} messages</span>
        <button onClick={onClear} className="text-white/40 transition-colors hover:text-white/70">
          Clear
        </button>
      </div>
    </div>
  )
}
