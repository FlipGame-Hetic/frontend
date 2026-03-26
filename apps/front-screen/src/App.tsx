import type { CameraProps } from "@react-three/fiber"
import { Leva } from "leva"
import BallsManager from "./components/balls/BallsManager"
import DebugCamera from "./components/DebugCamera"
import PhysicsManager from "./components/physics/PhysicsManager"
import FlipperJoints from "./components/flipperJoints/FlipperJoints"
import { LEFT_POSITION, RIGHT_POSITION } from "./components/flipperJoints/jointsConfig"
import Gutters from "./components/Gutters"
import Walls from "./components/Walls"
import World from "./components/World"
import BumpersManager from "./components/bumbers/BumpersManager"
import Plunger from "./components/plunger/Plunger"

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
          <Gutters />
          <BumpersManager />
          <FlipperJoints position={LEFT_POSITION} side="left" />
          <FlipperJoints position={RIGHT_POSITION} side="right" />
          <Plunger />
        </PhysicsManager>
      </World>
    </>
  )
}
