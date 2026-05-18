import type { CameraProps } from "@react-three/fiber"
import { Leva } from "leva"
import { Suspense } from "react"
import BallsManager from "./components/balls/BallsManager"
import DebugCamera from "./components/DebugCamera"
import PhysicsManager from "./components/physics/PhysicsManager"
import PlayfieldScene from "./components/playfield/PlayfieldScene"
import Plunger from "./components/plunger/Plunger"
import World from "./components/World"
import { useIoTInputs } from "./hooks/useIoTInputs"
import { useScreenHub } from "./hooks/useScreenHub"
import { useDebugKeys } from "./hooks/useDebugKeys"
import { WebsocketTest } from "./websocket-test/WebsocketTest"

const isDebug = import.meta.env.MODE === "development"
const isWsTest = isDebug && new URLSearchParams(window.location.search).has("wstest")

export default function App() {
  const cameraSettings = { position: [0, 1.33, 1.67] as [number, number, number], fov: 35 }

  useIoTInputs()
  useScreenHub()
  useDebugKeys()

  if (isWsTest) return <WebsocketTest />

  return (
    <>
      <Leva
        hidden={!isDebug}
        titleBar={{ title: "Tweaks GUI" }}
        theme={{ sizes: { rootWidth: "350px" } }}
      />
      <World cameraSettings={cameraSettings as CameraProps}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[0.33, 0.33, 0.33]} intensity={1} />
        <DebugCamera cameraPosition={cameraSettings.position} cameraFov={cameraSettings.fov} />

        <PhysicsManager isDebug={isDebug}>
          <BallsManager />
          <Suspense fallback={null}>
            <PlayfieldScene />
          </Suspense>
          <Plunger />
        </PhysicsManager>
      </World>
    </>
  )
}
