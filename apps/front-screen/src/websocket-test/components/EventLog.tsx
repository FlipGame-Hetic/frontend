import { cn } from "@frontend/utils"

import type { LogEntry } from "@/websocket-test/types"

interface Props {
  log: LogEntry[]
  onClear: () => void
}

export function EventLog({ log, onClear }: Props) {
  return (
    <div className="flex flex-col border border-cyan-400/20 p-4 shadow-[0_0_12px_#22d3ee11]">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[10px] tracking-[0.35em] text-cyan-400/40 uppercase">
          {"// Event Log"}
        </div>
        {log.length > 0 && (
          <button
            onClick={() => {
              onClear()
            }}
            className="text-[10px] tracking-widest text-cyan-400/25 uppercase transition-colors hover:text-cyan-400/50"
          >
            clear
          </button>
        )}
      </div>

      <div className="max-h-175 flex-1 space-y-1 overflow-y-auto">
        {log.length === 0 ? (
          <div className="mt-12 text-center text-xs text-cyan-400/20 italic">
            awaiting events...
          </div>
        ) : (
          log.map((entry) => (
            <div
              key={entry.id}
              className="border-l-2 border-cyan-400/20 py-1 pl-2 transition-colors hover:border-cyan-400/50"
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-[10px] text-cyan-400/35">{entry.time}</span>
                <span
                  className={cn(
                    "truncate text-[11px] font-bold text-cyan-300",
                    "[text-shadow:0_0_6px_#22d3ee]",
                  )}
                >
                  {entry.type}
                </span>
              </div>
              <div className="truncate text-[10px] text-cyan-400/40">
                {JSON.stringify(entry.payload)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
