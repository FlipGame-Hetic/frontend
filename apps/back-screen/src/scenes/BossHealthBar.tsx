import { resolveBoss } from "@/boss/bossConfig"
import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { cn } from "@frontend/utils"

const NAME_SHADOW =
  "3px 0 rgba(197,0,60,0.55), -3px 0 rgba(85,234,212,0.5), 0 4px 0 rgba(0,0,0,0.95)"

export default function BossHealthBar() {
  const bossId = useBackScreenStore((s) => s.bossId)
  const bossHp = useBackScreenStore((s) => s.bossHp)
  const bossMaxHp = useBackScreenStore((s) => s.bossMaxHp)
  const lastDamage = useBackScreenStore((s) => s.lastDamage)

  const def = resolveBoss(bossId)
  const pct = bossMaxHp > 0 ? Math.max(0, Math.min(1, bossHp / bossMaxHp)) : 0
  const widthPct = `${String(pct * 100)}%`

  const hitClass = lastDamage.at > 0 ? (lastDamage.big ? "boss-bar-hit" : "boss-bar-tap") : ""

  return (
    <div className="pointer-events-none absolute right-0 bottom-10 left-0 z-40 flex flex-col items-center gap-3">
      <div
        key={lastDamage.big ? lastDamage.at : "name"}
        className={cn(
          "font-display text-[clamp(1.6rem,3.6vw,3rem)] leading-none font-bold tracking-[0.18em] uppercase",
          lastDamage.big && "boss-name-hit",
        )}
        style={{ color: "#F4F4F4", textShadow: NAME_SHADOW }}
      >
        {def.name}
      </div>

      <div className="relative h-0.75 w-[56%] max-w-215 bg-[rgba(255,255,255,0.06)]">
        <div
          className="absolute top-0 left-0 h-full bg-[#C5003C] transition-[width] duration-300 ease-out"
          style={{ width: widthPct }}
        />
        <div
          key={lastDamage.at}
          className={cn("boss-bar-glow absolute top-0 left-0 h-full bg-[#C5003C]", hitClass)}
          style={{ width: widthPct }}
        />
      </div>
    </div>
  )
}
