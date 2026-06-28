import { CHARACTER_OPTIONS, type ScoreEntry } from "@frontend/types"
import { formatScore } from "@frontend/utils"

interface LeaderboardProps {
  entries: ScoreEntry[]
  highlightScore?: number
  max?: number
  accentColor?: string
  className?: string
}

export function Leaderboard({
  entries,
  highlightScore,
  max = 10,
  accentColor = "#55EAD4",
  className = "max-w-[clamp(22rem,42vw,38rem)]",
}: LeaderboardProps) {
  const rows = entries.slice(0, max)
  const highlightIndex =
    highlightScore === undefined ? -1 : rows.findIndex((e) => e.score === highlightScore)

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="font-mono text-[clamp(0.3rem,0.75vw,0.58rem)] tracking-[0.2em] text-[rgba(243,230,0,0.25)] uppercase">
        {"// CLASSEMENT //"}
      </div>

      {rows.length === 0 ? (
        <div className="font-mono text-[clamp(0.5rem,1.2vw,0.95rem)] tracking-[0.2em] text-[rgba(243,230,0,0.18)] uppercase">
          AUCUN SCORE ENREGISTRÉ
        </div>
      ) : (
        <ol className="grid grid-cols-[auto_auto_auto_auto] gap-x-5 gap-y-1">
          {rows.map((entry, i) => {
            const isHighlight = i === highlightIndex
            const character = CHARACTER_OPTIONS[entry.character_id]

            return (
              <li
                key={entry.id}
                className="col-span-full grid grid-cols-subgrid items-center border-l-2 py-1 pl-3"
                style={{
                  borderColor: isHighlight ? accentColor : "rgba(243,230,0,0.1)",
                  background: isHighlight ? `${accentColor}14` : "transparent",
                }}
              >
                <span className="font-mono text-[clamp(0.5rem,1.2vw,0.95rem)] tracking-[0.15em] text-[rgba(243,230,0,0.45)] tabular-nums">
                  {`#${String(i + 1).padStart(2, "0")}`}
                </span>
                <span
                  className="font-display text-[clamp(0.9rem,2.4vw,2.05rem)] font-bold tracking-[0.12em] tabular-nums"
                  style={{ color: isHighlight ? accentColor : "rgba(85,234,212,0.7)" }}
                >
                  {formatScore(entry.score)}
                </span>
                {character ? (
                  <span
                    className="font-mono text-[clamp(0.9rem,2.4vw,2.05rem)] tracking-[0.18em] uppercase"
                    style={{ color: character.material }}
                  >
                    {character.label}
                  </span>
                ) : (
                  <span />
                )}
                {entry.boss_reached > 0 ? (
                  <span className="font-mono text-[clamp(0.5rem,1.2vw,0.95rem)] tracking-[0.18em] text-[rgba(197,0,60,0.7)] uppercase">
                    {`BOSS ${String(entry.boss_reached)}`}
                  </span>
                ) : (
                  <span />
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
