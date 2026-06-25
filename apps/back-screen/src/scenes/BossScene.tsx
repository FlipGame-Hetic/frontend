import { Canvas } from "@react-three/fiber"
import BossManager from "@/boss/BossManager"
import BossHealthBar from "./BossHealthBar"
import BossVictoryOverlay from "./BossVictoryOverlay"
import FrameRateLimiter from "./FrameRateLimiter"

export default function BossScene() {
  return (
    <div className="bg-arcade-black absolute inset-0 z-30">
      <Canvas
        dpr={[1, 1.5]}
        flat
        frameloop="demand"
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <FrameRateLimiter fps={30} />
        <BossManager />
      </Canvas>
      <BossHealthBar />
      <BossVictoryOverlay />
    </div>
  )
}
