import PostProcessing from "./postprocessing/PostProcessing"
import { Canvas, type CameraProps } from "@react-three/fiber"
import type { ReactNode } from "react"
import NightCityEnvironment from "./environment/NightCityEnvironment"
import { useControls } from "leva"

interface WorldProps {
  cameraSettings: CameraProps
  children: ReactNode
}

const World = ({ cameraSettings, children }: WorldProps) => {
  const { pixelRatio } = useControls("Main", {
    pixelRatio: { value: window.devicePixelRatio, min: 0, max: 3, step: 0.05 },
  })

  return (
    <div className="h-dvh w-full">
      <Canvas
        dpr={pixelRatio}
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
