import { cn } from "@frontend/utils"
import type { GamePhase } from "@frontend/types"
import { GAME_PHASE } from "@frontend/types"
import { useBackScreenStore } from "@/stores/useBackScreenStore"

const PHASES: GamePhase[] = Object.values(GAME_PHASE)

const LABELS: Record<GamePhase, string> = {
  [GAME_PHASE.Idle]: "IDLE",
  [GAME_PHASE.ModeSelect]: "MODE",
  [GAME_PHASE.CharacterSelect]: "CHAR",
  [GAME_PHASE.Playing]: "PLAY",
  [GAME_PHASE.Paused]: "PAUSE",
  [GAME_PHASE.GameOver]: "OVER",
}

export function PhaseSwitcher() {
  const phase = useBackScreenStore((s) => s.phase)
  const setPhase = useBackScreenStore((s) => s.setPhase)
  const bossActive = useBackScreenStore((s) => s.bossActive)

  if (!import.meta.env.DEV) return null
  if (bossActive) return null

  return (
    <div className="z-50 flex h-full w-17 shrink-0 flex-col justify-center overflow-hidden border-l border-l-[rgba(243,230,0,0.2)] bg-[rgba(8,11,18,0.95)] shadow-[0_0_24px_rgba(0,0,0,0.7)] backdrop-blur-sm lg:w-21 xl:w-24">
      <div className="border-b border-b-[rgba(243,230,0,0.1)] px-2 py-2 text-center font-mono text-[8px] tracking-widest text-[rgba(243,230,0,0.25)] uppercase lg:text-[10px] xl:text-[12px]">
        PHASE
      </div>

      {PHASES.map((p) => {
        const isActive = p === phase
        return (
          <button
            key={p}
            onClick={() => {
              setPhase(p)
            }}
            className={cn(
              "w-full cursor-pointer border-l-2 py-2 font-mono text-[8px] tracking-wider uppercase transition-colors duration-150 lg:py-3 lg:text-[11px] xl:py-4 xl:text-[13px]",
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
