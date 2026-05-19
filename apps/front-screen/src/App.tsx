import type { CameraProps } from "@react-three/fiber"
import { Leva } from "leva"
import { Suspense } from "react"
import BallsManager from "./components/balls/BallsManager"
import DebugCamera from "./components/DebugCamera"
import ProductionCamera from "./components/ProductionCamera"
import PhysicsManager from "./components/physics/PhysicsManager"
import PlayfieldScene from "./components/playfield/PlayfieldScene"
import World from "./components/World"
import { useDebugKeys } from "./hooks/useDebugKeys"
import { useIoTInputs } from "./hooks/useIoTInputs"
import { useScreenHub } from "./hooks/useScreenHub"
import { WebsocketTest } from "./websocket-test/WebsocketTest"

const isProduction = import.meta.env.VITE_ENVIRONMENT === "production"
const isWsTest = !isProduction && new URLSearchParams(window.location.search).has("wstest")

export default function App() {
  const cameraSettings = { position: [0, 20, 25] as [number, number, number], fov: 35 }

  useIoTInputs()
  useScreenHub()
  useDebugKeys()

  if (isWsTest) return <WebsocketTest />

  return (
    <>
      <Leva
        hidden={false}
        titleBar={{ title: "Tweaks GUI" }}
        theme={{ sizes: { rootWidth: "350px" } }}
      />
      <World cameraSettings={cameraSettings as CameraProps}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[0, 13, 12]} intensity={0.4} />
        {isProduction ? (
          <ProductionCamera />
        ) : (
          <DebugCamera cameraPosition={cameraSettings.position} cameraFov={cameraSettings.fov} />
        )}

        <PhysicsManager isDebug={true}>
          <BallsManager />
          <Suspense fallback={null}>
            <PlayfieldScene />
          </Suspense>
          {/* <Plunger /> */}
        </PhysicsManager>
      </World>
    </>
  )
}
