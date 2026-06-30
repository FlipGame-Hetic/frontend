import DebugProvider from "@/debug/DebugProvider"
import { ConnectionOverlay, useDebugOverlayShown } from "@frontend/ui"
import { runtimeEnvironment } from "@frontend/utils"
import type { CameraProps } from "@react-three/fiber"
import { Leva } from "leva"
import { Suspense, useEffect } from "react"
import BallsManager from "./components/balls/BallsManager"
import CabinetCamera from "./components/CabinetCamera"
import ControlHints from "./components/controlHints/ControlHintsManager"
import DefaultCamera from "./components/DefaultCamera"
import Drain from "./components/drain/Drain"
import TronGridFloor from "./components/environment/TronGridFloor"
import SceneAmbientLight from "./components/light/SceneAmbientLight"
import PhysicsManager from "./components/physics/PhysicsManager"
import InvisibleWallsManager from "./components/physics/walls/InvisibleWallsManager"
import PlayfieldScene from "./components/playfield/PlayfieldScene"
import PlungerLaneGate from "./components/plunger/PlungerLaneGate"
import PortalsManager from "./components/portal/PortalsManager"
import ScorePopupsManager from "./components/scorePopups/ScorePopupsManager"
import ScreenShakeController from "./components/screenShake/ScreenShakeController"
import { GUTTER_DRAIN_ASSIST_SENSORS } from "./components/sensors/directionalAccelerationSensorsConfig"
import DirectionalAccelerationSensorsManager from "./components/sensors/DirectionalAccelerationSensorsManager"
import SoundManager from "./components/sound/SoundManager"
import TopTunnelAssistManager from "./components/topTunnelAssist/TopTunnelAssistManager"
import UltimateBar from "./components/ultimate/UltimateBar"
import UltimateScreenTint from "./components/ultimate/UltimateScreenTint"
import ParticleBurstManager from "./components/vfx/ParticleBurstManager"
import World from "./components/World"
import { useFlipperButtonRelay } from "./hooks/useFlipperButtonRelay"
import { useScreenHub } from "./hooks/useScreenHub"
import { useUltimateInput } from "./hooks/useUltimateInput"
import useCharactersStore from "./stores/useCharactersStore"

const App = () => {
  const hubStatus = useScreenHub()
  useFlipperButtonRelay()
  useUltimateInput()

  const overlayShown = useDebugOverlayShown()

  useEffect(() => {
    void useCharactersStore.getState().load()
  }, [])

  const cameraSettings = { position: [0, 13, 15] as [number, number, number], fov: 35 }

  return (
    <DebugProvider>
      <SoundManager />
      <Leva
        hidden={!overlayShown}
        titleBar={{ title: "Tweaks GUI" }}
        theme={{ sizes: { rootWidth: "350px" } }}
      />
      <World cameraSettings={cameraSettings as CameraProps}>
        <SceneAmbientLight />
        <directionalLight
          position={[0, 13, 12]}
          intensity={0.8}
          castShadow
          shadow-mapSize={[256, 256]}
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
          <DefaultCamera cameraPosition={cameraSettings.position} cameraFov={cameraSettings.fov} />
        )}
        <ScreenShakeController />
        <TronGridFloor />
        <PhysicsManager showStats={overlayShown}>
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
        <ParticleBurstManager />
        <ControlHints />
        <UltimateBar />
      </World>
      <UltimateScreenTint />
      <ConnectionOverlay status={hubStatus} />
    </DebugProvider>
  )
}

export default App
