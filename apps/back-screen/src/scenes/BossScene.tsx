import { Canvas } from "@react-three/fiber"
import BossManager from "@/boss/BossManager"
import BossWarningShader from "@/boss/renderers/BossWarningShader"
import { useBackScreenStore } from "@/stores/useBackScreenStore"
import BossHealthBar from "./BossHealthBar"
import BossVictoryOverlay from "./BossVictoryOverlay"
import BossWarningOverlay from "./BossWarningOverlay"
import FrameRateLimiter from "./FrameRateLimiter"

export default function BossScene() {
  const bossReady = useBackScreenStore((s) => s.bossReady)

  return (
    <div className="bg-arcade-black absolute inset-0 z-30">
      <Canvas
        dpr={1}
        flat
        frameloop="demand"
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <FrameRateLimiter fps={30} />
        {bossReady ? <BossManager /> : <BossWarningShader />}
      </Canvas>
      {!bossReady && <BossWarningOverlay />}
      <BossHealthBar />
      <BossVictoryOverlay />
    </div>
  )
}
