"use client"

import type { CameraProps } from "@react-three/fiber"
import { Leva } from "leva"
import BallsManager from "./components/balls/BallsManager"
import DebugCamera from "./components/DebugCamera"
import PhysicsManager from "./components/physics/PhysicsManager"
import Walls from "./components/Walls"
import World from "./components/World"

const isDebug = import.meta.env.MODE === "development"

export default function App() {
  const cameraSettings = { position: [0, 20, 25] as [number, number, number], fov: 35 }

  return (
    <>
      <Leva
        hidden={!isDebug}
        titleBar={{ title: "Tweaks GUI" }}
        theme={{ sizes: { rootWidth: "350px" } }}
      />
      <World cameraSettings={cameraSettings as CameraProps}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <DebugCamera cameraPosition={cameraSettings.position} cameraFov={cameraSettings.fov} />

        <PhysicsManager isDebug={isDebug}>
          <BallsManager />
          <Walls />
        </PhysicsManager>
      </World>
    </>
  )
}
