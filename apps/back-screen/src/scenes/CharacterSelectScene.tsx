import { cn } from "@frontend/utils"
import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { CHARACTER_OPTIONS } from "./scene.types"
import { MenuControlsLegend } from "@/components/MenuControlsLegend"
import BigBall from "./characterSelect/BigBall"

export default function CharacterSelectScene() {
  const menuIndex = useBackScreenStore((s) => s.menuIndex)
  const active = CHARACTER_OPTIONS[menuIndex] ?? CHARACTER_OPTIONS[0]

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <MenuControlsLegend />

      <div className="relative z-10 flex h-full w-full flex-col pb-[clamp(80px,15vh,130px)] landscape:flex-row">
        <div className="flex min-h-0 w-full flex-col justify-center gap-[clamp(1rem,3vh,1.5rem)] p-[clamp(1.5rem,4vw,3rem)] landscape:flex-1 landscape:justify-between landscape:gap-0">
          <div className="font-mono text-[clamp(0.32rem,0.8vw,0.62rem)] tracking-[0.28em] text-[rgba(85,234,212,0.4)] uppercase">
            FIGHTER.IDENTIFICATION // SÉLECTION
          </div>

          <div className="flex flex-col gap-5">
            <div className="font-display text-[clamp(2rem,5.4vw,4.8rem)] leading-none font-bold tracking-widest text-[#F3E600] uppercase [text-shadow:2px_0_rgba(197,0,60,0.45),-2px_0_rgba(85,234,212,0.4),0_3px_0_rgba(0,0,0,0.95)]">
              {active.label}
            </div>

            <div className="h-px w-28 bg-[linear-gradient(90deg,rgba(243,230,0,0.3),transparent)]" />

            <div className="font-mono text-[clamp(0.58rem,1.9vw,1.4rem)] leading-relaxed text-[rgba(85,234,212,0.42)]">
              {active.locked ? "DONNÉES NON DISPONIBLES." : active.description}
            </div>

            {!active.locked && (
              <div
                className="relative mt-2 max-w-[34ch] border-l-2 pl-4"
                style={{ borderColor: active.color }}
              >
                <div
                  className="mb-2 flex items-center gap-2 font-mono text-[clamp(0.3rem,0.78vw,0.6rem)] tracking-[0.32em] uppercase"
                  style={{ color: active.color }}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rotate-45"
                    style={{ background: active.color, boxShadow: `0 0 8px ${active.color}` }}
                  />
                  ULTIME // CAPACITÉ SPÉCIALE
                </div>
                <div className="font-mono text-[clamp(0.5rem,1.5vw,1.18rem)] leading-relaxed text-[rgba(243,230,0,0.78)]">
                  {active.description_ultimate}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col items-center justify-center gap-[clamp(1rem,3vh,2rem)] p-[clamp(1.5rem,4vw,3rem)] landscape:w-[42%] landscape:justify-between landscape:gap-0 landscape:py-12 landscape:pr-14 landscape:pl-0">
          <div className="hidden landscape:block" />

          <BigBall option={active} />

          <div className="flex gap-5">
            {CHARACTER_OPTIONS.map((opt, i) => (
              <div key={opt.id} className="flex flex-col items-center gap-2">
                <SmallBall option={opt} isActive={i === menuIndex} />
                {opt.locked && (
                  <div className="font-mono text-[clamp(0.18rem,0.36vw,0.26rem)] tracking-widest text-[rgba(243,230,0,0.2)] uppercase">
                    BIENTÔT
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SmallBall({
  option,
  isActive,
}: {
  option: (typeof CHARACTER_OPTIONS)[number]
  isActive: boolean
}) {
  return (
    <div
      className={cn(
        "h-11 w-11 rounded-full transition-all duration-300",
        isActive ? "scale-[1.3]" : "scale-100",
        option.locked ? "opacity-[0.14]" : isActive ? "opacity-100" : "opacity-[0.32]",
      )}
      style={{
        background: option.gradient,
        boxShadow: isActive && option.glow !== "none" ? option.glow : "none",
      }}
    />
  )
}
