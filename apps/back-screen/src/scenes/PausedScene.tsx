import { RetroBackground } from "@/components/RetroBackground"

export default function PausedScene() {
  return (
    <div className="bg-arcade-black relative flex h-full w-full overflow-hidden">
      <RetroBackground accentColor="#F3E600" withBlur />

      <div className="relative z-10 flex h-full w-full flex-col justify-between p-12">
        <div className="font-mono text-[clamp(0.38rem,0.78vw,0.54rem)] tracking-[0.28em] text-[rgba(85,234,212,0.45)] uppercase">
          SYS.PAUSE // EN ATTENTE
        </div>

        <div className="font-display text-[clamp(5rem,14vw,12rem)] leading-none font-bold tracking-[0.14em] text-[#F3E600] uppercase [text-shadow:3px_0_rgba(197,0,60,0.5),-3px_0_rgba(85,234,212,0.45),0_5px_0_rgba(0,0,0,0.95)]">
          PAUSE
        </div>

        <div className="font-mono text-[clamp(0.35rem,0.72vw,0.5rem)] tracking-[0.22em] text-[rgba(243,230,0,0.3)] uppercase">
          {"// FLIPPER POUR REPRENDRE //"}
        </div>
      </div>
    </div>
  )
}
