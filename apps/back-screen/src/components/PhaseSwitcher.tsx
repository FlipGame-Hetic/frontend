import { cn } from "@frontend/utils"
import type { GamePhase } from "@frontend/types"
import { useBackScreenStore } from "@/stores/useBackScreenStore"

const PHASES: GamePhase[] = [
  "idle",
  "mode_select",
  "character_select",
  "playing",
  "paused",
  "game_over",
]

const LABELS: Record<GamePhase, string> = {
  idle: "IDLE",
  mode_select: "MODE",
  character_select: "CHAR",
  playing: "PLAY",
  paused: "PAUSE",
  game_over: "OVER",
}

export function PhaseSwitcher() {
  const phase = useBackScreenStore((s) => s.phase)
  const setPhase = useBackScreenStore((s) => s.setPhase)

  if (!import.meta.env.DEV) return null

  return (
    <div className="absolute top-1/2 right-4 z-50 flex w-[68px] -translate-y-1/2 flex-col overflow-hidden border border-[rgba(243,230,0,0.2)] bg-[rgba(8,11,18,0.95)] shadow-[0_0_24px_rgba(0,0,0,0.7)] backdrop-blur-[8px]">
      <div className="border-b border-b-[rgba(243,230,0,0.1)] px-2 py-2 text-center font-mono text-[8px] tracking-widest text-[rgba(243,230,0,0.25)] uppercase">
        PHASE
      </div>

      {PHASES.map((p) => {
        const isActive = p === phase
        return (
          <button
            key={p}
            onClick={() => { setPhase(p); }}
            className={cn(
              "w-full cursor-pointer border-l-2 py-2 font-mono text-[8px] tracking-wider uppercase transition-colors duration-150",
              isActive
                ? "border-l-[#F3E600] bg-[rgba(243,230,0,0.08)] text-[#F3E600]"
                : "border-l-transparent bg-transparent text-[rgba(243,230,0,0.2)]",
            )}
          >
            {LABELS[p]}
          </button>
        )
      })}
    </div>
  )
}
