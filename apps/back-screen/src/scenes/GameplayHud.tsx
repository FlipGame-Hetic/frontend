import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { RetroBackground } from "@/components/RetroBackground"
import { formatScore } from "@/utils/formatScore"

export default function GameplayHud() {
  const ballNumber = useBackScreenStore((s) => s.ballNumber)
  const score = useBackScreenStore((s) => s.score)

  return (
    <div className="bg-arcade-black relative flex h-full w-full overflow-hidden">
      <RetroBackground />

      <div className="relative z-10 flex h-full w-full flex-col justify-between p-10">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[clamp(0.38rem,0.75vw,0.52rem)] tracking-[0.28em] text-[rgba(85,234,212,0.5)] uppercase">
            PROTOCOLE.ACTIF // SÉQUENCE EN COURS
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-[clamp(0.3rem,0.6vw,0.42rem)] tracking-widest text-[rgba(243,230,0,0.35)] uppercase">
              BILLE
            </div>
            <BallIndicator current={ballNumber} total={3} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-mono text-[clamp(0.3rem,0.6vw,0.42rem)] tracking-widest text-[rgba(243,230,0,0.35)] uppercase">
            SCORE
          </div>
          <div className="font-display text-[clamp(3.5rem,10vw,9rem)] leading-none font-bold tracking-[0.06em] text-[#55EAD4] tabular-nums [text-shadow:3px_0_rgba(197,0,60,0.55),-3px_0_rgba(85,234,212,0.5),0_4px_0_rgba(0,0,0,0.95)]">
            {formatScore(score)}
          </div>
          <div className="font-mono text-[clamp(0.5rem,1vw,0.7rem)] tracking-widest text-[rgba(85,234,212,0.3)] uppercase">
            PTS
          </div>
        </div>

        <div className="h-px bg-[rgba(243,230,0,0.1)]" />
      </div>
    </div>
  )
}

function BallIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="size-2.25 rounded-full border border-[rgba(243,230,0,0.35)]"
          style={{
            background: i < current ? "#F3E600" : "transparent",
            boxShadow: i < current ? "0 0 6px rgba(243,230,0,0.5)" : "none",
          }}
        />
      ))}
    </div>
  )
}
