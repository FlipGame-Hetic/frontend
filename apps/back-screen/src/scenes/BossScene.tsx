import { Canvas } from "@react-three/fiber"
import BossManager from "@/boss/BossManager"
import BossHealthBar from "./BossHealthBar"

export default function BossScene() {
  return (
    <div className="bg-arcade-black absolute inset-0 z-30">
      <Canvas flat gl={{ antialias: false }}>
        <BossManager />
      </Canvas>
      <BossHealthBar />
    </div>
  )
}
