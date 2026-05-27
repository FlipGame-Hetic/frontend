import type { CameraProps } from "@react-three/fiber"
import { MainDebugProvider, useMainDebugControls } from "@/debug/mainDebugContext"
import { Leva } from "leva"
import { Suspense } from "react"
import BallsManager from "./components/balls/BallsManager"
import Drain from "./components/drain/Drain"
import DebugCamera from "./components/DebugCamera"
import ProductionCamera from "./components/ProductionCamera"
import Ceiling from "./components/physics/Ceiling"
import TopTunnelCollider from "./components/physics/TopTunnelCollider"
import PhysicsManager from "./components/physics/PhysicsManager"
import PlayfieldScene from "./components/playfield/PlayfieldScene"
import PlungerLaneGate from "./components/plunger/PlungerLaneGate"
import PlungerLaneCeiling from "./components/plunger/PlungerLaneCeiling"
import PlungerLaneGateDebug from "./components/plunger/PlungerLaneGateDebug"
import SoundManager from "./components/sound/SoundManager"
import TestBench from "./components/playfield/TestBench"
import World from "./components/World"
import { useDebugKeys } from "./hooks/useDebugKeys"
import { useIoTInputs } from "./hooks/useIoTInputs"
import { useScreenHub } from "./hooks/useScreenHub"
import { WebsocketTest } from "./websocket-test/WebsocketTest"

const isProduction = import.meta.env.VITE_ENVIRONMENT === "production"
const isWsTest = !isProduction && new URLSearchParams(window.location.search).has("wstest")

function AppContent() {
  const cameraSettings = { position: [0, 20, 25] as [number, number, number], fov: 35 }
  const { testBench } = useMainDebugControls()

  return (
    <>
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

        <PhysicsManager isDebug={true}>
          <BallsManager />
          <Drain />
          <Ceiling />
          <TopTunnelCollider />
          <PlungerLaneGate />
          <PlungerLaneCeiling />
          <PlungerLaneGateDebug />
          {testBench ? (
            <TestBench />
          ) : (
            <Suspense fallback={null}>
              <PlayfieldScene />
            </Suspense>
          )}
          {/* <Plunger /> */}
        </PhysicsManager>
      </World>
    </>
  )
}

export default function App() {
  useIoTInputs()
  useScreenHub()
  useDebugKeys()

  if (isWsTest) return <WebsocketTest />

  return (
    <MainDebugProvider>
      <AppContent />
    </MainDebugProvider>
  )
}
