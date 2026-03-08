import { useState } from "react"

import { CyberBtn } from "@/websocket-test/components/CyberBtn"
import { Section } from "@/websocket-test/components/Section"
import type { Dispatcher } from "@/websocket-test/types"

interface Props {
  onDispatch: Dispatcher
}

export function EnergySection({ onDispatch }: Props) {
  const [energy, setEnergy] = useState(50)

  return (
    <Section title="Energy Bar" color="purple">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-violet-400/40">0</span>
          <span className="text-sm font-bold text-violet-400 [text-shadow:0_0_8px_#a78bfa]">
            {`${String(energy)}%`}
          </span>
          <span className="text-violet-400/40">100</span>
        </div>

        <div className="h-1 w-full bg-violet-400/10">
          <div
            className="h-full bg-violet-400 shadow-[0_0_8px_#a78bfa] transition-all duration-100"
            style={{ width: `${String(energy)}%` }}
          />
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={energy}
          onChange={(e) => {
            setEnergy(Number(e.target.value))
          }}
          className="w-full accent-violet-400"
        />

        <CyberBtn
          label={`Send Energy — ${String(energy)}%`}
          event="player:energy"
          payload={{ value: energy }}
          color="purple"
          onDispatch={onDispatch}
        />
      </div>
    </Section>
  )
}
