import { useCallback, useState } from "react"

import { EventLog } from "@/websocket-test/components/EventLog"
import { Header } from "@/websocket-test/components/Header"
import { CyberLayout } from "@/websocket-test/components/layout/CyberLayout"
import { BallSection } from "@/websocket-test/components/sections/BallSection"
import { BumperSection } from "@/websocket-test/components/sections/BumperSection"
import { EnergySection } from "@/websocket-test/components/sections/EnergySection"
import { FlipperSection } from "@/websocket-test/components/sections/FlipperSection"
import { GameSection } from "@/websocket-test/components/sections/GameSection"
import { SpecialsSection } from "@/websocket-test/components/sections/SpecialsSection"
import { mockSend } from "@/websocket-test/mock-send"
import type { Dispatcher, LogEntry } from "@/websocket-test/types"

export function WebsocketTest() {
  const [log, setLog] = useState<LogEntry[]>([])

  const dispatch = useCallback<Dispatcher>((type, payload = {}) => {
    mockSend(type, payload)
    setLog((prev) => [
      {
        id: Date.now() + Math.random(),
        type,
        payload,
        time: new Date().toLocaleTimeString("fr-FR", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
      ...prev.slice(0, 49),
    ])
  }, [])

  return (
    <CyberLayout>
      <Header />

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
