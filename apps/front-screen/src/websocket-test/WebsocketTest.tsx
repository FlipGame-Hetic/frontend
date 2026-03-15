import { useCallback, useState } from "react"

import type { GameMessage } from "@frontend/types"
import { useGameSocket } from "@frontend/ws"
import { EventLog } from "@/websocket-test/components/EventLog"
import { Header } from "@/websocket-test/components/Header"
import { CyberLayout } from "@/websocket-test/components/layout/CyberLayout"
import { BallSection } from "@/websocket-test/components/sections/BallSection"
import { BumperSection } from "@/websocket-test/components/sections/BumperSection"
import { EnergySection } from "@/websocket-test/components/sections/EnergySection"
import { FlipperSection } from "@/websocket-test/components/sections/FlipperSection"
import { GameSection } from "@/websocket-test/components/sections/GameSection"
import { SpecialsSection } from "@/websocket-test/components/sections/SpecialsSection"
import type { Dispatcher, LogEntry } from "@/websocket-test/types"

function toLogEntry(type: string, payload: unknown, direction: "→" | "←"): LogEntry {
  return {
    id: Date.now() + Math.random(),
    type: `${direction} ${type}`,
    payload,
    time: new Date().toLocaleTimeString("fr-FR", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  }
}

export function WebsocketTest() {
  const [log, setLog] = useState<LogEntry[]>([])

  const onMessage = useCallback((message: GameMessage) => {
    setLog((prev) => [toLogEntry(message._type, message, "←"), ...prev.slice(0, 49)])
  }, [])

  const { status, send } = useGameSocket({ onMessage })

  const dispatch = useCallback<Dispatcher>(
    (type, payload = {}) => {
      send({ dir: "outbound", device_id: "front-screen", _type: type, ...(payload as object) })
      setLog((prev) => [toLogEntry(type, payload, "→"), ...prev.slice(0, 49)])
    },
    [send],
  )

  return (
    <CyberLayout>
      <Header status={status} />

      <div className="grid grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          <GameSection onDispatch={dispatch} />
          <FlipperSection onDispatch={dispatch} />
          <BallSection onDispatch={dispatch} />
          <BumperSection onDispatch={dispatch} />
          <SpecialsSection onDispatch={dispatch} />
          <EnergySection onDispatch={dispatch} />
        </div>

        <EventLog
          log={log}
          onClear={() => {
            setLog([])
          }}
        />
      </div>
    </CyberLayout>
  )
}
