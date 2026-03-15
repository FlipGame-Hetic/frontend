import { useCallback, useState } from "react"
import type { GameMessage } from "@frontend/types"
import { useGameSocket } from "@frontend/ws"
import { StatusBar } from "@/components/StatusBar"
import { TerminalLog } from "@/components/TerminalLog"
import type { LogEntry } from "@/components/TerminalLog"

const MAX_LOGS = 500

let nextId = 0

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([])

  const onMessage = useCallback((message: GameMessage) => {
    const entry: LogEntry = {
      id: nextId++,
      timestamp: new Date(),
      message,
    }
    setLogs((prev) => {
      const next = [...prev, entry]
      return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next
    })
  }, [])

  const { status } = useGameSocket({ onMessage })

  const handleClear = useCallback(() => {
    setLogs([])
  }, [])

  return (
    <div className="bg-surface-dark flex h-screen flex-col text-white">
      <StatusBar status={status} messageCount={logs.length} onClear={handleClear} />
      <TerminalLog logs={logs} />
    </div>
  )
}

export default App
