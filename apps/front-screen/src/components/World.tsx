import { Canvas, type CameraProps } from "@react-three/fiber"
import type { ReactNode } from "react"
import NightCityEnvironment from "./environment/NightCityEnvironment"
import PostProcessing from "./postprocessing/PostProcessing"

interface WorldProps {
  cameraSettings: CameraProps
  children: ReactNode
}

const World = ({ cameraSettings, children }: WorldProps) => {
  return (
    <div className="h-dvh w-full">
      <Canvas
        // Uses R3F's [min, max] DPR tuple to cap dense-screen rendering at 2.
        dpr={[1, 2]}
        gl={{ powerPreference: "high-performance" }}
        shadows="percentage"
        camera={cameraSettings}
        onCreated={({ gl }) => {
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
