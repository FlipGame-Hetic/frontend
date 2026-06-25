import { useCallback, useState } from "react"
import type { GameMessage } from "@frontend/types"
import { GAME_PHASE } from "@frontend/types"
import { useGameSocket } from "@frontend/ws"
import { ConnectionOverlay } from "@frontend/ui"
import { StatusBar } from "@/components/StatusBar"
import { TerminalLog } from "@/components/TerminalLog"
import type { LogEntry } from "@/components/TerminalLog"
import { PhaseSwitcher } from "@/components/PhaseSwitcher"
import { RetroBackground } from "@/components/RetroBackground"
import SceneRouter from "@/scenes/SceneRouter"
import { useScreenHubClient } from "@/hooks/useScreenHubClient"
import { useKeyboardInput } from "@/hooks/useKeyboardInput"
import { useBackScreenStore } from "@/stores/useBackScreenStore"

const MAX_LOGS = 500
const isDebug = new URLSearchParams(window.location.search).has("debug")

let nextId = 0

function App() {
  const hubStatus = useScreenHubClient()
  useKeyboardInput()

  const phase = useBackScreenStore((s) => s.phase)
  const [logs, setLogs] = useState<LogEntry[]>([])

  const onMessage = useCallback((message: GameMessage) => {
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

  const accentColor = phase === GAME_PHASE.GameOver ? "#C5003C" : "#F3E600"
  const withBlur = phase === GAME_PHASE.Paused || phase === GAME_PHASE.GameOver

  return (
    <div className="bg-arcade-black relative flex h-screen w-screen overflow-hidden">
      <RetroBackground accentColor={accentColor} withBlur={withBlur} />
      <div className="relative z-10 flex h-full w-full">
        <div className="relative min-w-0 flex-1">
          <SceneRouter />
        </div>
        <PhaseSwitcher />
      </div>
      <ConnectionOverlay status={hubStatus} />
    </div>
  )
}

export default App
