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

      <div className="relative z-10 flex h-full w-full flex-col pb-[clamp(80px,11vh,130px)] landscape:flex-row">
        <div className="flex min-h-0 w-full flex-col justify-center border-b border-[rgba(243,230,0,0.08)] p-[clamp(1.5rem,4vw,3rem)] landscape:w-[44%] landscape:border-r landscape:border-b-0">
          <div className="mb-[clamp(1rem,3vh,2rem)] font-mono text-[clamp(0.32rem,0.8vw,0.62rem)] tracking-[0.25em] text-[rgba(85,234,212,0.4)] uppercase">
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
                    "flex items-center gap-5 border-b border-b-[rgba(243,230,0,0.05)] py-[clamp(0.6rem,2.2vh,1.25rem)] transition-all duration-300",
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
                      "font-display text-[clamp(1.4rem,3.6vw,3.2rem)] font-bold tracking-widest uppercase",
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

        <div className="flex min-h-0 flex-1 flex-col justify-center gap-[clamp(1rem,2.5vh,1.5rem)] p-[clamp(1.5rem,4vw,3.5rem)]">
          <div className="font-display text-[clamp(2.5rem,6.4vw,5.8rem)] leading-none font-bold tracking-[0.12em] text-[#F3E600] uppercase [text-shadow:2px_0_rgba(197,0,60,0.45),-2px_0_rgba(85,234,212,0.4),0_3px_0_rgba(0,0,0,0.95)]">
            {active.label}
          </div>

          <div className="h-px w-24 bg-[linear-gradient(90deg,rgba(243,230,0,0.3),transparent)]" />

          <div className="max-w-[26ch] font-mono text-[clamp(0.65rem,1.6vw,1.25rem)] leading-relaxed text-[rgba(85,234,212,0.5)]">
            {active.locked ? "DONNÉES NON DISPONIBLES." : active.description}
          </div>
        </div>
      </div>
    </div>
  )
}
