import { useEffect } from "react"
import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { playBossDefeated } from "@/audio/menuSound"

export default function BossVictoryOverlay() {
  const bossDefeatedAt = useBackScreenStore((s) => s.bossDefeatedAt)

  useEffect(() => {
    if (bossDefeatedAt === 0) return
    playBossDefeated()
  }, [bossDefeatedAt])

  if (bossDefeatedAt === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
      <div
        key={bossDefeatedAt}
        className="boss-victory font-display text-[clamp(4rem,14vw,12rem)] leading-none font-bold tracking-[0.12em] text-[#55EAD4] uppercase [text-shadow:3px_0_rgba(197,0,60,0.55),-3px_0_rgba(85,234,212,0.5),0_4px_0_rgba(0,0,0,0.95)]"
      >
        VICTORY
      </div>
    </div>
  )
}
