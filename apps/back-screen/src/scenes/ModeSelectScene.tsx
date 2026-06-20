import { cn } from "@frontend/utils"
import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { MODE_OPTIONS } from "./scene.types"
import { MenuControlsLegend } from "@/components/MenuControlsLegend"

export default function ModeSelectScene() {
  const menuIndex = useBackScreenStore((s) => s.menuIndex)
  const active = MODE_OPTIONS[menuIndex] ?? MODE_OPTIONS[0]

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <MenuControlsLegend />

      <div className="relative z-10 flex h-full w-full pb-[clamp(80px,11vh,130px)]">
        <div className="flex w-[44%] flex-col justify-center border-r border-r-[rgba(243,230,0,0.08)] p-12">
          <div className="mb-8 font-mono text-[clamp(0.32rem,0.65vw,0.46rem)] tracking-[0.25em] text-[rgba(85,234,212,0.4)] uppercase">
            SÉLECTION.PROTOCOLE // MODE
          </div>

          <div className="flex flex-col">
            {MODE_OPTIONS.map((option, i) => {
              const isActive = i === menuIndex
              const isLocked = option.locked === true
              return (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center gap-5 border-b border-b-[rgba(243,230,0,0.05)] py-5 transition-all duration-300",
                    isLocked ? "opacity-[0.22]" : isActive ? "opacity-100" : "opacity-[0.35]",
                  )}
                >
                  <div
                    className={cn(
                      "w-0.75 shrink-0 transition-[height] duration-300 ease-in-out",
                      isActive ? "h-9 bg-[#F3E600]" : "h-3.5 bg-[rgba(243,230,0,0.2)]",
                    )}
                  />
                  <div
                    className={cn(
                      "font-display text-[clamp(1.4rem,3.2vw,2.6rem)] font-bold tracking-widest uppercase",
                      isActive
                        ? "text-[#F3E600] [text-shadow:2px_0_rgba(197,0,60,0.4),-2px_0_rgba(85,234,212,0.35)]"
                        : "text-[rgba(243,230,0,0.4)]",
                    )}
                  >
                    {option.label}
                  </div>
                  {isLocked && (
                    <div className="ml-auto shrink-0 border border-[rgba(243,230,0,0.1)] px-1.5 py-0.5 font-mono text-[clamp(0.2rem,0.38vw,0.28rem)] tracking-widest text-[rgba(243,230,0,0.25)] uppercase">
                      BIENTÔT
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-6 p-14">
          <div className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-none font-bold tracking-[0.12em] text-[#F3E600] uppercase [text-shadow:2px_0_rgba(197,0,60,0.45),-2px_0_rgba(85,234,212,0.4),0_3px_0_rgba(0,0,0,0.95)]">
            {active.label}
          </div>

          <div className="h-px w-24 bg-[linear-gradient(90deg,rgba(243,230,0,0.3),transparent)]" />

          <div className="max-w-[26ch] font-mono text-[clamp(0.65rem,1.3vw,0.9rem)] leading-relaxed text-[rgba(85,234,212,0.5)]">
            {active.locked ? "DONNÉES NON DISPONIBLES." : active.description}
          </div>
        </div>
      </div>
    </div>
  )
}
