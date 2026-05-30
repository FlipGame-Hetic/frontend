import DebugProvider from "@/debug/DebugProvider"
import type { CameraProps } from "@react-three/fiber"
import { Leva } from "leva"
import { Suspense } from "react"
import BallsManager from "./components/balls/BallsManager"
import DebugCamera from "./components/DebugCamera"
import Drain from "./components/drain/Drain"
import InvisibleWallsManager from "./components/physics/InvisibleWallsManager"
import PhysicsManager from "./components/physics/PhysicsManager"
import PlayfieldScene from "./components/playfield/PlayfieldScene"
import TopTunnelAssistManager from "./components/playfield/TopTunnelAssistManager"
import PlungerLaneGate from "./components/plunger/PlungerLaneGate"
import PortalsManager from "./components/portal/PortalsManager"
import ProductionCamera from "./components/ProductionCamera"
import ScorePopupsManager from "./components/scorePopups/ScorePopupsManager"
import ScreenShakeController from "./components/screenShake/ScreenShakeController"
import SoundManager from "./components/sound/SoundManager"
import World from "./components/World"
import { useDebugKeys } from "./hooks/useDebugKeys"
import { useIoTInputs } from "./hooks/useIoTInputs"
import { useScreenHub } from "./hooks/useScreenHub"
import WebsocketTest from "./websocket-test/WebsocketTest"

const isProduction = import.meta.env.VITE_ENVIRONMENT === "production"
const isWsTest = !isProduction && new URLSearchParams(window.location.search).has("wstest")

const App = () => {
  useIoTInputs()
  useScreenHub()
  useDebugKeys()

  const cameraSettings = { position: [0, 20, 25] as [number, number, number], fov: 35 }

  if (isWsTest) return <WebsocketTest />

  return (
    <DebugProvider>
      <SoundManager />
      <Leva
        hidden={false}
        titleBar={{ title: "Tweaks GUI" }}
        theme={{ sizes: { rootWidth: "350px" } }}
      />
      <World cameraSettings={cameraSettings as CameraProps}>
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[0, 13, 12]}
          intensity={0.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.5}
          shadow-camera-far={60}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-bias={-0.001}
          shadow-normalBias={0.1}
        />
        {isProduction ? (
          <ProductionCamera />
        ) : (
          <DebugCamera cameraPosition={cameraSettings.position} cameraFov={cameraSettings.fov} />
        )}
        <ScreenShakeController />

        <PhysicsManager isDebug={false}>
          <BallsManager />
          <Drain />
          <InvisibleWallsManager />
          <TopTunnelAssistManager />
          <PortalsManager />
          <PlungerLaneGate />
          <ScorePopupsManager />
          <Suspense fallback={null}>
            <PlayfieldScene />
          </Suspense>
        </PhysicsManager>
      </World>
    </DebugProvider>
  )
}

export default App
