import { useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import BossWarningShader from "@/boss/renderers/BossWarningShader"
import { playBossAppearSequence } from "@/audio/menuSound"
import { useBackScreenStore } from "@/stores/useBackScreenStore"

const FALLBACK_MS = 4500

export default function BossWarning() {
  const setBossReady = useBackScreenStore((s) => s.setBossReady)

  useEffect(() => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      setBossReady()
    }

    const cancelSequence = playBossAppearSequence(finish)
    const fallback = setTimeout(finish, FALLBACK_MS)

    return () => {
      cancelSequence()
      clearTimeout(fallback)
    }
  }, [setBossReady])

  return (
    <div className="bg-arcade-black absolute inset-0 z-30">
      <Canvas flat gl={{ antialias: false, powerPreference: "high-performance" }}>
        <BossWarningShader />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
        <div
          className="boss-warning font-display text-[clamp(4rem,16vw,14rem)] leading-none font-bold tracking-[0.12em] text-[#FF0033] uppercase"
          data-text="WARNING"
        >
          WARNING
        </div>
      </div>
    </div>
  )
}
