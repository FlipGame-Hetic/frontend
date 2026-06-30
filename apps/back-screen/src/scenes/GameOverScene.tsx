import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { Leaderboard } from "@/components/Leaderboard"
import { useFitRows } from "@/hooks/useFitRows"
import { formatScore } from "@frontend/utils"
import { useRef } from "react"

const ACCENT = "#C5003C"

export default function GameOverScene() {
  const score = useBackScreenStore((s) => s.score)
  const leaderboard = useBackScreenStore((s) => s.leaderboard)

  const betterCount = leaderboard.filter((e) => e.score > score).length
  const rank = betterCount + 1
  const rankLabel = `RANG #${String(rank).padStart(2, "0")}`

  const fitRef = useRef<HTMLDivElement>(null)
  const fitCount = useFitRows(fitRef, { hardMax: 10, rowSelector: "li", listSelector: "ol" })

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <div className="relative z-10 flex h-full w-full flex-col gap-[clamp(0.75rem,2vh,2rem)] p-[clamp(2rem,4vw,3rem)]">
        <div className="shrink-0 font-mono text-[clamp(0.38rem,0.95vw,0.72rem)] tracking-[0.3em] text-[rgba(197,0,60,0.55)] uppercase">
          PROCESSUS.TERMINÉ // CONNEXION PERDUE
        </div>

        <div className="flex shrink-0 flex-col gap-[clamp(0.5rem,1.5vh,1rem)]">
          <div className="font-display text-[clamp(2.5rem,9vw,8rem)] leading-none font-bold tracking-widest text-[#C5003C] uppercase [text-shadow:3px_0_rgba(243,230,0,0.5),-3px_0_rgba(85,234,212,0.4),0_5px_0_rgba(0,0,0,0.95)]">
            GAME OVER
          </div>

          <div className="h-px w-40 bg-[rgba(197,0,60,0.25)]" />

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <div className="font-display text-[clamp(2rem,5.9vw,5.2rem)] font-bold tracking-widest text-[#55EAD4] tabular-nums [text-shadow:3px_0_rgba(197,0,60,0.55),-3px_0_rgba(85,234,212,0.5),0_4px_0_rgba(0,0,0,0.95)]">
              {formatScore(score)}
            </div>
            <div className="font-mono text-[clamp(0.55rem,1.35vw,1.1rem)] tracking-widest text-[rgba(85,234,212,0.45)] uppercase">
              PTS
            </div>
            <div className="cp-blink font-display ml-auto text-[clamp(0.8rem,2vw,1.75rem)] font-bold tracking-[0.2em] text-[#F3E600] uppercase portrait:hidden">
              RECOMMENCER ?
            </div>
          </div>

          <div className="font-display text-[clamp(0.9rem,2.3vw,1.95rem)] font-bold tracking-[0.2em] text-[#C5003C] uppercase">
            {rankLabel}
          </div>
        </div>

        <div ref={fitRef} className="min-h-0 flex-1 overflow-hidden">
          <Leaderboard
            entries={leaderboard}
            highlightScore={score}
            accentColor={ACCENT}
            max={fitCount}
            className="w-full max-w-none"
          />
        </div>

        <div className="cp-blink font-display hidden shrink-0 text-[clamp(0.9rem,5vw,1.75rem)] font-bold tracking-[0.2em] text-[#F3E600] uppercase portrait:block">
          RECOMMENCER ?
        </div>
      </div>
    </div>
  )
}
