import { Canvas, type CameraProps } from "@react-three/fiber"
import type { ReactNode } from "react"

interface WorldProps {
  cameraSettings: CameraProps
  children: ReactNode
}

const World = ({ cameraSettings, children }: WorldProps) => {
  return (
    <div className="h-dvh w-full">
      <Canvas shadows camera={cameraSettings}>
        <color attach="background" args={["#0a0a12"]} />
        {children}
      </Canvas>
    </div>
  )
}

export default World
