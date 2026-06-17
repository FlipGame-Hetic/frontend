import PostProcessing from "./postprocessing/PostProcessing"
import { Canvas, type CameraProps } from "@react-three/fiber"
import type { ReactNode } from "react"
import NightCityEnvironment from "./environment/NightCityEnvironment"

interface WorldProps {
  cameraSettings: CameraProps
  children: ReactNode
}

const World = ({ cameraSettings, children }: WorldProps) => {
  return (
    <div className="h-dvh w-full">
      <Canvas
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
