import { useCallback } from "react"
import type { GameMessage } from "@frontend/types"
import { useGameSocket } from "@frontend/ws"

function App() {
  const onMessage = useCallback((message: GameMessage) => {
    console.debug("[DMD] received:", message._type, message)
  }, [])

  const { status } = useGameSocket({ onMessage })

  return (
    <div className="bg-surface-dark flex h-screen flex-col items-center justify-center text-white">
      <h1 className="font-display text-neon-cyan text-2xl">DMD Screen</h1>
      <p className="mt-2 text-sm text-white/60">
        WS:{" "}
        <span
          className={
            status === "connected"
              ? "text-neon-cyan"
              : status === "connecting"
                ? "text-neon-yellow"
                : "text-neon-pink"
          }
        >
          {status}
        </span>
      </p>
    </div>
  )
}

export default App
