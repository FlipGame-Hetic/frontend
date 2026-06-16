import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { RetroBackground } from "@/components/RetroBackground"

export default function GameOverScene() {
  const score = useBackScreenStore((s) => s.score)

  return (
    <div className="bg-arcade-black relative flex h-full w-full overflow-hidden">
      <RetroBackground accentColor="#C5003C" withBlur />

      <div className="relative z-10 flex h-full w-full flex-col justify-between p-12">
        <div className="font-mono text-[clamp(0.38rem,0.78vw,0.54rem)] tracking-[0.3em] text-[rgba(197,0,60,0.55)] uppercase">
          PROCESSUS.TERMINÉ // CONNEXION PERDUE
        </div>

        <div className="flex flex-col gap-4">
          <div className="font-display text-[clamp(3.5rem,11vw,9.5rem)] leading-none font-bold tracking-widest text-[#C5003C] uppercase [text-shadow:3px_0_rgba(243,230,0,0.5),-3px_0_rgba(85,234,212,0.4),0_5px_0_rgba(0,0,0,0.95)]">
            GAME OVER
          </div>

          <div className="h-px w-40 bg-[rgba(197,0,60,0.25)]" />

          <div className="flex items-baseline gap-4">
            <div className="font-display text-[clamp(2rem,5.5vw,4.5rem)] font-bold tracking-widest text-[#55EAD4] tabular-nums [text-shadow:2px_3px_0px_rgba(0,0,0,0.95)]">
              {String(score)
                .padStart(6, "0")
                .replace(/(\d{3})(\d{3})/, "$1.$2")}
            </div>
            <div className="font-mono text-[clamp(0.55rem,1.1vw,0.8rem)] tracking-widest text-[rgba(85,234,212,0.45)] uppercase">
              PTS
            </div>
          </div>
        </div>

        <div className="cp-blink font-display text-[clamp(0.8rem,1.7vw,1.3rem)] font-bold tracking-[0.2em] text-[#F3E600] uppercase">
          RECOMMENCER ?
        </div>
      </div>
    </div>
  )
}
