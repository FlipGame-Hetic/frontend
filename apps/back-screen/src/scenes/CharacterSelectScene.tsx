import { cn } from "@frontend/utils"
import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { CHARACTER_OPTIONS } from "./scene.types"
import { RetroBackground } from "@/components/RetroBackground"

export default function CharacterSelectScene() {
  const menuIndex = useBackScreenStore((s) => s.menuIndex)
  const active = CHARACTER_OPTIONS[menuIndex] ?? CHARACTER_OPTIONS[0]

  return (
    <div className="bg-arcade-black relative flex h-full w-full overflow-hidden">
      <RetroBackground />

      <div className="relative z-10 flex h-full w-full">
        <div className="flex flex-1 flex-col justify-between p-12">
          <div className="font-mono text-[clamp(0.32rem,0.65vw,0.46rem)] tracking-[0.28em] text-[rgba(85,234,212,0.4)] uppercase">
            FIGHTER.IDENTIFICATION // SÉLECTION
          </div>

          <div className="flex flex-col gap-5">
            <div className="font-display text-[clamp(2rem,5vw,4.2rem)] leading-none font-bold tracking-widest text-[#F3E600] uppercase [text-shadow:2px_0_rgba(197,0,60,0.45),-2px_0_rgba(85,234,212,0.4),0_3px_0_rgba(0,0,0,0.95)]">
              {active.label}
            </div>

            <div className="h-px w-28 bg-[linear-gradient(90deg,rgba(243,230,0,0.3),transparent)]" />

            <div className="font-mono text-[clamp(0.58rem,1.6vw,1rem)] leading-relaxed text-[rgba(85,234,212,0.42)]">
              {active.locked ? "DONNÉES NON DISPONIBLES." : active.description}
            </div>
          </div>

          <div className="font-mono text-[clamp(0.28rem,0.55vw,0.38rem)] tracking-widest text-[rgba(243,230,0,0.2)] uppercase">
            FLIPPER.G / FLIPPER.D — NAVIGUER // CHOISIR
          </div>
        </div>

        <div className="flex w-[42%] flex-col items-center justify-between py-12 pr-14">
          <div />

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

function BigBall({ option }: { option: (typeof CHARACTER_OPTIONS)[number] }) {
  return (
    <div
      className="h-[clamp(130px,19vw,240px)] w-[clamp(130px,19vw,240px)] rounded-full transition-all duration-300"
      style={{
        background: option.gradient,
        boxShadow: option.glow !== "none" ? option.glow : "none",
      }}
    />
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
