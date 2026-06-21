import { Leaderboard } from "@/components/Leaderboard"
import { useBackScreenStore } from "@/stores/useBackScreenStore"

export default function IdleScene() {
  const leaderboard = useBackScreenStore((s) => s.leaderboard)

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <div className="relative z-10 flex h-full w-full flex-col justify-between p-12">
        <div className="flex flex-col gap-4">
          <div className="font-mono text-[clamp(0.32rem,0.68vw,0.48rem)] tracking-[0.28em] text-[rgba(243,230,0,0.3)] uppercase">
            SYS.INITIALISÉ // ATTENTE CRÉDIT
          </div>

          <div className="cp-glitch font-display text-[clamp(3rem,9vw,8rem)] leading-none font-bold tracking-[0.14em] text-[#F3E600] uppercase [text-shadow:3px_0_rgba(197,0,60,0.55),-3px_0_rgba(85,234,212,0.5),0_4px_0_rgba(0,0,0,0.95)]">
            S.P.A.M.E.R.
          </div>

          <div className="font-mono text-[clamp(0.4rem,0.78vw,0.54rem)] tracking-[0.2em] text-[rgba(85,234,212,0.4)] uppercase">
            {/* SYSTEMATIC PAUPER ANNIHILATION FOR MASS ELITE RECREATION */}
            SUPER PINBALL ARCADE MULTIPLAYER EXPERIENCE RIVALRY
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[rgba(243,230,0,0.1)]" />
          <div className="size-1 bg-[rgba(243,230,0,0.4)]" />
          <div className="h-px w-16 bg-[rgba(243,230,0,0.1)]" />
        </div>

        <div className="flex items-end justify-between gap-8">
          <Leaderboard entries={leaderboard} />

          <div className="cp-blink font-display text-[clamp(0.8rem,1.8vw,1.4rem)] font-bold tracking-[0.22em] text-[#F3E600] uppercase">
            INSÉRER CRÉDIT
          </div>
        </div>
      </div>
    </div>
  )
}
