import { Canvas, type CameraProps } from "@react-three/fiber"
import type { ReactNode } from "react"

interface WorldProps {
  cameraSettings: CameraProps
  children: ReactNode
}

const World = ({ cameraSettings, children }: WorldProps) => {
  return (
    <div className="h-dvh w-full">
      <Canvas camera={cameraSettings}>{children}</Canvas>
    </div>
  )
}

export default World
