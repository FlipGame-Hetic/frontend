import { Leaderboard } from "@/components/Leaderboard"
import { useFitRows } from "@/hooks/useFitRows"
import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { useRef } from "react"

export default function IdleScene() {
  const leaderboard = useBackScreenStore((s) => s.leaderboard)

  const fitRef = useRef<HTMLDivElement>(null)
  const fitCount = useFitRows(fitRef, { hardMax: 10, rowSelector: "li", listSelector: "ol" })

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <div className="relative z-10 flex h-full w-full flex-col gap-[clamp(0.75rem,2vh,1.5rem)] p-[clamp(2rem,4vw,3rem)]">
        <div className="flex shrink-0 flex-col gap-4">
          <div className="font-mono text-[clamp(0.32rem,0.82vw,0.64rem)] tracking-[0.28em] text-[rgba(243,230,0,0.3)] uppercase">
            SYS.INITIALISÉ // ATTENTE CRÉDIT
          </div>

          <div className="cp-glitch font-display text-[clamp(3rem,9.5vw,9rem)] leading-none font-bold tracking-[0.14em] text-[#F3E600] uppercase [text-shadow:3px_0_rgba(197,0,60,0.55),-3px_0_rgba(85,234,212,0.5),0_4px_0_rgba(0,0,0,0.95)]">
            S.P.A.M.E.R.
          </div>

          <div className="font-mono text-[clamp(0.4rem,0.95vw,0.72rem)] tracking-[0.2em] text-[rgba(85,234,212,0.4)] uppercase">
            {/* SYSTEMATIC PAUPER ANNIHILATION FOR MASS ELITE RECREATION */}
            SUPER PINBALL ARCADE MULTIPLAYER EXPERIENCE RIVALRY
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="h-px flex-1 bg-[rgba(243,230,0,0.1)]" />
          <div className="size-1 bg-[rgba(243,230,0,0.4)]" />
          <div className="h-px w-16 bg-[rgba(243,230,0,0.1)]" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-[clamp(0.75rem,2vh,1.5rem)] landscape:flex-row landscape:gap-8">
          <div ref={fitRef} className="min-h-0 flex-1 overflow-hidden">
            <Leaderboard
              entries={leaderboard}
              max={fitCount}
              className="w-full max-w-none landscape:max-w-[clamp(22rem,42vw,38rem)]"
            />
          </div>

          <div className="cp-blink font-display shrink-0 text-[clamp(0.8rem,2.1vw,1.9rem)] font-bold tracking-[0.22em] text-[#F3E600] uppercase landscape:self-end">
            INSÉRER CRÉDIT
          </div>
        </div>
      </div>
    </div>
  )
}
