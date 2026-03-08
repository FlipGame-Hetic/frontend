import type { ConnectionStatus } from "@frontend/types"

const statusConfig: Record<ConnectionStatus, { dot: string; label: string; subtitle: string }> = {
  connected: {
    dot: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
    label: "Online",
    subtitle: "socket connected",
  },
  connecting: {
    dot: "bg-yellow-400 animate-pulse shadow-[0_0_8px_#facc15]",
    label: "Connecting...",
    subtitle: "connecting...",
  },
  disconnected: {
    dot: "bg-red-400 shadow-[0_0_8px_#f87171]",
    label: "Offline",
    subtitle: "socket disconnected",
  },
}

interface Props {
  status: ConnectionStatus
}

export function SocketStatus({ status }: Props) {
  const { dot, label, subtitle } = statusConfig[status]
  return (
    <div className="text-right">
      <div className="mb-1 flex items-center justify-end gap-2">
        <div className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-[10px] tracking-widest text-yellow-400/70 uppercase">{label}</span>
      </div>
      <div className="text-[10px] tracking-widest text-cyan-400/25">{subtitle}</div>
    </div>
  )
}
