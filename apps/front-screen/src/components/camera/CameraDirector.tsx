import { useDebugControls } from "@/debug/debugContext"
import useGameStore from "@/stores/useGameStore"
import useScreenShakeStore from "@/stores/useScreenShakeStore"
import { easeInOutCubic, easeInOutSine } from "@/utils/easing"
import { GAME_PHASE, type GamePhase } from "@frontend/types"
import { runtimeEnvironment } from "@frontend/utils"
import { Line, OrbitControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { useEffect, useMemo, useRef } from "react"
import { MathUtils, PerspectiveCamera } from "three"
import {
  CABINET_CAMERA,
  CAMERA_DIRECTOR_FRAME_PRIORITY,
  DEMO_IDLE_DELAY_SECONDS,
  DEMO_TRANSITION_DURATION_SECONDS,
  getGameplayCameraPose,
  type CabinetCameraSettings,
  type CameraPose,
} from "../cameraConfig"
import {
  DEMO_CAMERA_PATHS,
  getDemoCameraPath,
  sampleDemoCameraPath,
  type DemoCameraPath,
} from "./demoPaths"

type CameraDirectorMode = "fixed" | "demo" | "returning"

interface ReturnTransition {
  elapsed: number
  from: CameraPose
}

const isPreGamePhase = (phase: GamePhase): boolean =>
  phase === GAME_PHASE.Idle ||
  phase === GAME_PHASE.ModeSelect ||
  phase === GAME_PHASE.CharacterSelect

const captureCameraPose = (camera: PerspectiveCamera): CameraPose => ({
  position: camera.position.clone(),
  quaternion: camera.quaternion.clone(),
  fov: camera.fov,
})

const applyCameraPose = (camera: PerspectiveCamera, pose: CameraPose): void => {
  camera.position.copy(pose.position)
  camera.quaternion.copy(pose.quaternion)
  if (camera.fov !== pose.fov) {
    camera.fov = pose.fov
    camera.updateProjectionMatrix()
  }
}

const applyDemoPathPose = (
  camera: PerspectiveCamera,
  path: DemoCameraPath,
  normalizedTime: number,
  fov: number,
): void => {
  const easedTime = easeInOutSine(MathUtils.clamp(normalizedTime, 0, 1))
  const sample = sampleDemoCameraPath(path, easedTime)

  camera.position.copy(sample.position)
  camera.lookAt(sample.lookAt)
  camera.rotateZ(sample.rollRadians)
  if (camera.fov !== fov) {
    camera.fov = fov
    camera.updateProjectionMatrix()
  }
}

const DemoPathDebug = ({ pathIndex, scrub }: { pathIndex: number; scrub: number }) => {
  const selectedPathIndex = MathUtils.clamp(Math.round(pathIndex), 0, DEMO_CAMERA_PATHS.length - 1)
  const selectedPath = getDemoCameraPath(selectedPathIndex)
  const selectedSample = sampleDemoCameraPath(selectedPath, MathUtils.clamp(scrub, 0, 1))

  const debugCurves = useMemo(
    () =>
      DEMO_CAMERA_PATHS.map((path) => ({
        id: path.id,
        positionPoints: path.positionCurve.getPoints(80),
        lookAtPoints: path.lookAtCurve.getPoints(80),
      })),
    [],
  )

  return (
    <>
      {debugCurves.map((path, index) => {
        const selected = index === selectedPathIndex
        return (
          <group key={path.id}>
            <Line
              points={path.positionPoints}
              color={selected ? "#00f0ff" : "#4f7d8a"}
              lineWidth={selected ? 2 : 1}
              transparent
              opacity={selected ? 0.95 : 0.4}
            />
            <Line
              points={path.lookAtPoints}
              color={selected ? "#ff2d6b" : "#7a4454"}
              lineWidth={1}
              transparent
              opacity={selected ? 0.68 : 0.25}
            />
          </group>
        )
      })}
      <mesh position={selectedSample.position}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#ffe156" />
      </mesh>
      <mesh position={selectedSample.lookAt}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial color="#ff2d6b" />
      </mesh>
      <Line
        points={[selectedSample.position, selectedSample.lookAt]}
        color="#ffe156"
        lineWidth={1}
        transparent
        opacity={0.76}
      />
    </>
  )
}

const CameraDirector = () => {
  const getThreeState = useThree((state) => state.get)
  const phase = useGameStore((state) => state.phase)
  const { enabled: orbitControlsEnabled } = useDebugControls()

  const cabinetCamera = useControls(
    "Cabinet Camera",
    {
      fov: { value: CABINET_CAMERA.fov, min: 10, max: 200, step: 0.5 },
      posX: { value: CABINET_CAMERA.posX, min: -50, max: 50, step: 0.1, label: "pos X" },
      posY: { value: CABINET_CAMERA.posY, min: -50, max: 50, step: 0.1, label: "pos Y" },
      posZ: { value: CABINET_CAMERA.posZ, min: -50, max: 50, step: 0.1, label: "pos Z" },
      rotX: { value: CABINET_CAMERA.rotX, min: -180, max: 180, step: 1, label: "rot X (deg)" },
      rotY: { value: CABINET_CAMERA.rotY, min: -180, max: 180, step: 1, label: "rot Y (deg)" },
      rotZ: { value: CABINET_CAMERA.rotZ, min: -180, max: 180, step: 1, label: "rot Z (deg)" },
    },
    { collapsed: !runtimeEnvironment.isProductionCabinet },
  ) as CabinetCameraSettings
  const {
    fov: cabinetFov,
    posX: cabinetPosX,
    posY: cabinetPosY,
    posZ: cabinetPosZ,
    rotX: cabinetRotX,
    rotY: cabinetRotY,
    rotZ: cabinetRotZ,
  } = cabinetCamera

  const { showPaths, pathIndex, scrub } = useControls(
    "Demo Camera",
    {
      showPaths: false,
      pathIndex: {
        value: 0,
        min: 0,
        max: DEMO_CAMERA_PATHS.length - 1,
        step: 1,
        label: "Path",
      },
      scrub: { value: 0, min: 0, max: 1, step: 0.001 },
    },
    { collapsed: true },
  )

  const gameplayPose = useMemo(
    () =>
      getGameplayCameraPose({
        isProductionCabinet: runtimeEnvironment.isProductionCabinet,
        cabinetCamera: {
          fov: cabinetFov,
          posX: cabinetPosX,
          posY: cabinetPosY,
          posZ: cabinetPosZ,
          rotX: cabinetRotX,
          rotY: cabinetRotY,
          rotZ: cabinetRotZ,
        },
      }),
    [cabinetFov, cabinetPosX, cabinetPosY, cabinetPosZ, cabinetRotX, cabinetRotY, cabinetRotZ],
  )

  const gameplayPoseRef = useRef(gameplayPose)
  const phaseRef = useRef(phase)
  const modeRef = useRef<CameraDirectorMode>("fixed")
  const idleSecondsRef = useRef(0)
  const wasPreGameRef = useRef(isPreGamePhase(phase))
  const fixedPoseAppliedRef = useRef(false)
  const demoPathIndexRef = useRef(0)
  const demoPathElapsedRef = useRef(0)
  const returnTransitionRef = useRef<ReturnTransition | null>(null)

  useEffect(() => {
    gameplayPoseRef.current = gameplayPose
  }, [gameplayPose])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    if (orbitControlsEnabled) return
    if (modeRef.current !== "fixed") return

    const camera = getThreeState().camera
    if (!(camera instanceof PerspectiveCamera)) return

    applyCameraPose(camera, gameplayPose)
    fixedPoseAppliedRef.current = true
  }, [gameplayPose, getThreeState, orbitControlsEnabled])

  useEffect(() => {
    if (orbitControlsEnabled) return

    modeRef.current = "fixed"
    idleSecondsRef.current = 0
    returnTransitionRef.current = null
    fixedPoseAppliedRef.current = false
    wasPreGameRef.current = isPreGamePhase(phaseRef.current)

    const camera = getThreeState().camera
    if (!(camera instanceof PerspectiveCamera)) return

    applyCameraPose(camera, gameplayPoseRef.current)
    fixedPoseAppliedRef.current = true
  }, [getThreeState, orbitControlsEnabled])

  useFrame((state, delta) => {
    if (orbitControlsEnabled) return
    if (!(state.camera instanceof PerspectiveCamera)) return

    const camera = state.camera
    const currentPhase = phaseRef.current
    const isPreGame = isPreGamePhase(currentPhase)
    const wasPreGame = wasPreGameRef.current

    if (isPreGame && !wasPreGame) {
      idleSecondsRef.current = 0
      modeRef.current = "fixed"
      returnTransitionRef.current = null
      fixedPoseAppliedRef.current = false
    }

    if (!isPreGame && wasPreGame) {
      idleSecondsRef.current = 0
      if (currentPhase === GAME_PHASE.Playing && modeRef.current === "demo") {
        modeRef.current = "returning"
        returnTransitionRef.current = { elapsed: 0, from: captureCameraPose(camera) }
        useScreenShakeStore.getState().setTrauma(0)
      } else {
        modeRef.current = "fixed"
        returnTransitionRef.current = null
        fixedPoseAppliedRef.current = false
      }
    }

    wasPreGameRef.current = isPreGame

    if (modeRef.current === "fixed") {
      if (!fixedPoseAppliedRef.current) {
        applyCameraPose(camera, gameplayPoseRef.current)
        fixedPoseAppliedRef.current = true
      }

      if (!isPreGame) {
        idleSecondsRef.current = 0
        return
      }

      idleSecondsRef.current += delta
      if (idleSecondsRef.current < DEMO_IDLE_DELAY_SECONDS) return

      modeRef.current = "demo"
      fixedPoseAppliedRef.current = false
      demoPathElapsedRef.current = 0
      useScreenShakeStore.getState().setTrauma(0)
    }

    if (modeRef.current === "demo") {
      if (!isPreGame) return

      const currentPath = getDemoCameraPath(demoPathIndexRef.current)
      demoPathElapsedRef.current += delta

      if (demoPathElapsedRef.current >= currentPath.durationSeconds) {
        demoPathIndexRef.current = (demoPathIndexRef.current + 1) % DEMO_CAMERA_PATHS.length
        demoPathElapsedRef.current = 0
      }

      const path = getDemoCameraPath(demoPathIndexRef.current)
      applyDemoPathPose(
        camera,
        path,
        demoPathElapsedRef.current / path.durationSeconds,
        gameplayPoseRef.current.fov,
      )
      return
    }

    const transition = returnTransitionRef.current
    if (!transition) {
      modeRef.current = "fixed"
      fixedPoseAppliedRef.current = false
      return
    }

    transition.elapsed += delta
    const targetPose = gameplayPoseRef.current
    const t = easeInOutCubic(
      MathUtils.clamp(transition.elapsed / DEMO_TRANSITION_DURATION_SECONDS, 0, 1),
    )

    camera.position.copy(transition.from.position).lerp(targetPose.position, t)
    camera.quaternion.copy(transition.from.quaternion).slerp(targetPose.quaternion, t)
    camera.fov = MathUtils.lerp(transition.from.fov, targetPose.fov, t)
    camera.updateProjectionMatrix()

    if (transition.elapsed < DEMO_TRANSITION_DURATION_SECONDS) return

    applyCameraPose(camera, targetPose)
    modeRef.current = "fixed"
    returnTransitionRef.current = null
    fixedPoseAppliedRef.current = true
  }, CAMERA_DIRECTOR_FRAME_PRIORITY)

  return (
    <>
      {orbitControlsEnabled ? <OrbitControls makeDefault /> : null}
      {orbitControlsEnabled && showPaths ? (
        <DemoPathDebug pathIndex={pathIndex} scrub={scrub} />
      ) : null}
    </>
  )
}

export default CameraDirector
