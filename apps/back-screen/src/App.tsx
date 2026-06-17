import { useCallback, useState } from "react"
import type { ButtonId, ButtonPayload, GameMessage } from "@frontend/types"
import { useGameSocket, wsLog } from "@frontend/ws"
import { StatusBar } from "@/components/StatusBar"
import { TerminalLog } from "@/components/TerminalLog"
import type { LogEntry } from "@/components/TerminalLog"
import { PhaseSwitcher } from "@/components/PhaseSwitcher"
import SceneRouter from "@/scenes/SceneRouter"
import { useScreenHubClient } from "@/hooks/useScreenHubClient"
import { useKeyboardInput } from "@/hooks/useKeyboardInput"
import { handleMenuButton } from "@/menu/menuActions"

const MAX_LOGS = 500
const isDebug = new URLSearchParams(window.location.search).has("debug")

let nextId = 0

function App() {
  useScreenHubClient()
  useKeyboardInput()

  const [logs, setLogs] = useState<LogEntry[]>([])

  const onMessage = useCallback((message: GameMessage) => {
    if (message._type === "Button") {
      const { id, state } = message as GameMessage & ButtonPayload
      wsLog("back-screen", `Button id=${id} state=${String(state)}`)
      if (state === 1) {
        wsLog("back-screen", `→ handleMenuButton(${id})`)
        handleMenuButton(id as ButtonId)
      }
    }

    if (!isDebug) return
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

  if (isDebug) {
    return (
      <div className="bg-surface-dark flex h-screen flex-col text-white">
        <StatusBar status={status} messageCount={logs.length} onClear={handleClear} />
        <TerminalLog logs={logs} />
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <SceneRouter />
      <PhaseSwitcher />
    </div>
  )
}

export default App
