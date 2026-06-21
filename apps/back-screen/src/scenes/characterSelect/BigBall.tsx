import { Canvas } from "@react-three/fiber"
import type { CHARACTER_OPTIONS } from "../scene.types"
import CharacterBallMesh from "./CharacterBallMesh"

export default function BigBall({ option }: { option: (typeof CHARACTER_OPTIONS)[number] }) {
  return (
    <div
      className="h-[clamp(130px,19vw,240px)] w-[clamp(130px,19vw,240px)] rounded-full transition-all duration-300"
      style={{
        boxShadow: option.glow !== "none" ? option.glow : "none",
      }}
    >
      <Canvas
        flat
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 2.37], fov: 50 }}
      >
        <CharacterBallMesh color={option.color} />
      </Canvas>
    </div>
  )
}
