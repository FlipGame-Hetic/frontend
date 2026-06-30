import { Canvas } from "@react-three/fiber"
import type { ReactNode } from "react"
import { DEFAULT_CAMERA } from "./cameraConfig"
import NightCityEnvironment from "./environment/NightCityEnvironment"
import PostProcessing from "./postprocessing/PostProcessing"

interface WorldProps {
  children: ReactNode
}

const World = ({ children }: WorldProps) => {
  return (
    <div className="h-dvh w-full">
      <Canvas
        // Uses R3F's [min, max] DPR tuple to cap dense-screen rendering at 2
        dpr={[1, 2]}
        gl={{ powerPreference: "high-performance" }}
        shadows="percentage"
        camera={DEFAULT_CAMERA}
        onCreated={({ gl }) => {
          // Enables material.clippingPlanes so the multiball gate can trim the parts of its meshes that overflow its frame
          gl.localClippingEnabled = true
        }}
      >
        <color attach="background" args={["#0a0a12"]} />
        <NightCityEnvironment />
        <PostProcessing />
        {children}
      </Canvas>
    </div>
  )
}

export default World
