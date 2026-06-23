import type { ScoreEntry } from "@frontend/types"
import { formatScore } from "@frontend/utils"

interface LeaderboardProps {
  entries: ScoreEntry[]
  highlightScore?: number
  max?: number
  accentColor?: string
}

export function Leaderboard({
  entries,
  highlightScore,
  max = 6,
  accentColor = "#55EAD4",
}: LeaderboardProps) {
  const rows = entries.slice(0, max)
  const highlightIndex =
    highlightScore === undefined ? -1 : rows.findIndex((e) => e.score === highlightScore)

  return (
    <div className="flex flex-col gap-2">
      <div className="font-mono text-[clamp(0.3rem,0.6vw,0.42rem)] tracking-[0.2em] text-[rgba(243,230,0,0.25)] uppercase">
        {"// CLASSEMENT //"}
      </div>

      {rows.length === 0 ? (
        <div className="font-mono text-[clamp(0.5rem,1vw,0.7rem)] tracking-[0.2em] text-[rgba(243,230,0,0.18)] uppercase">
          AUCUN SCORE ENREGISTRÉ
        </div>
      ) : (
        <ol className="flex flex-col gap-1">
          {rows.map((entry, i) => {
            const isHighlight = i === highlightIndex
            return (
              <li
                key={entry.id}
                className="flex items-baseline gap-4 border-l-2 py-0.5 pl-3"
                style={{
                  borderColor: isHighlight ? accentColor : "rgba(243,230,0,0.1)",
                  background: isHighlight ? `${accentColor}14` : "transparent",
                }}
              >
                <span className="font-mono text-[clamp(0.5rem,1vw,0.7rem)] tracking-[0.15em] text-[rgba(243,230,0,0.45)] tabular-nums">
                  {`#${String(i + 1).padStart(2, "0")}`}
                </span>
                <span
                  className="font-display flex-1 text-[clamp(0.9rem,2vw,1.5rem)] font-bold tracking-[0.12em] tabular-nums"
                  style={{ color: isHighlight ? accentColor : "rgba(85,234,212,0.7)" }}
                >
                  {formatScore(entry.score)}
                </span>
                {entry.boss_reached > 0 ? (
                  <span className="font-mono text-[clamp(0.34rem,0.7vw,0.46rem)] tracking-[0.18em] text-[rgba(197,0,60,0.7)] uppercase">
                    {`BOSS ${String(entry.boss_reached)}`}
                  </span>
                ) : null}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
