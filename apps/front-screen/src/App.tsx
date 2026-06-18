import DebugProvider from "@/debug/DebugProvider"
import { runtimeEnvironment } from "@/config/runtimeEnvironment"
import type { CameraProps } from "@react-three/fiber"
import { Leva } from "leva"
import { Suspense } from "react"
import ReactiveAmbientLight from "./components/audioReactive/ReactiveAmbientLight"
import BallsManager from "./components/balls/BallsManager"
import CabinetCamera from "./components/CabinetCamera"
import DebugCamera from "./components/DebugCamera"
import Drain from "./components/drain/Drain"
import TronGridFloor from "./components/environment/TronGridFloor"
import InvisibleWallsManager from "./components/physics/InvisibleWallsManager"
import PhysicsManager from "./components/physics/PhysicsManager"
import PlayfieldScene from "./components/playfield/PlayfieldScene"
import TopTunnelAssistManager from "./components/playfield/TopTunnelAssistManager"
import PlungerLaneGate from "./components/plunger/PlungerLaneGate"
import PortalsManager from "./components/portal/PortalsManager"
import ScorePopupsManager from "./components/scorePopups/ScorePopupsManager"
import ScreenShakeController from "./components/screenShake/ScreenShakeController"
import { GUTTER_DRAIN_ASSIST_SENSORS } from "./components/sensors/directionalAccelerationSensorsConfig"
import DirectionalAccelerationSensorsManager from "./components/sensors/DirectionalAccelerationSensorsManager"
import SoundManager from "./components/sound/SoundManager"
import World from "./components/World"
import { useDebugKeys } from "./hooks/useDebugKeys"
import { useFlipperButtonRelay } from "./hooks/useFlipperButtonRelay"
import { useScreenHub } from "./hooks/useScreenHub"
import WebsocketTest from "./websocket-test/WebsocketTest"

const isWsTest =
  !runtimeEnvironment.isProduction && new URLSearchParams(window.location.search).has("wstest")

const App = () => {
  useScreenHub()
  useDebugKeys()
  useFlipperButtonRelay()

  const cameraSettings = { position: [0, 13, 15] as [number, number, number], fov: 35 }

  if (isWsTest) return <WebsocketTest />

  return (
    <DebugProvider>
      <SoundManager />
      <Leva
        // hidden={runtimeEnvironment.isProduction}
        titleBar={{ title: "Tweaks GUI" }}
        theme={{ sizes: { rootWidth: "350px" } }}
      />
      <World cameraSettings={cameraSettings as CameraProps}>
        <ReactiveAmbientLight />
        <directionalLight
          position={[0, 13, 12]}
          intensity={0.8}
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
        {runtimeEnvironment.isProductionCabinet ? (
          <CabinetCamera />
        ) : (
          <DebugCamera cameraPosition={cameraSettings.position} cameraFov={cameraSettings.fov} />
        )}
        <ScreenShakeController />
        <TronGridFloor />
        <PhysicsManager isDebug={!runtimeEnvironment.isProduction}>
          <BallsManager />
          <Drain />
          <DirectionalAccelerationSensorsManager sensors={GUTTER_DRAIN_ASSIST_SENSORS} />
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
