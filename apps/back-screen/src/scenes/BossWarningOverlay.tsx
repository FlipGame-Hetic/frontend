import { useEffect } from "react"
import { playBossAppearSequence } from "@/audio/menuSound"
import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { WARNING_FINISH_MS } from "@/boss/bossConfig"

export default function BossWarningOverlay() {
  const setBossReady = useBackScreenStore((s) => s.setBossReady)

  useEffect(() => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      setBossReady()
    }

    const cancelSequence = playBossAppearSequence(finish)
    const fallback = setTimeout(finish, WARNING_FINISH_MS)

    return () => {
      cancelSequence()
      clearTimeout(fallback)
    }
  }, [setBossReady])

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
      <div
        className="boss-warning font-display text-[clamp(4rem,16vw,14rem)] leading-none font-bold tracking-[0.12em] text-[#FF0033] uppercase"
        data-text="WARNING"
      >
        WARNING
      </div>
    </div>
  )
}
