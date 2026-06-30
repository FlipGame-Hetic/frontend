import useGameStore from "@/stores/useGameStore"
import useScreenShakeStore from "@/stores/useScreenShakeStore"
import { GAME_PHASE, type GamePhase } from "@frontend/types"
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { PerspectiveCamera } from "three"
import {
  applyCameraPose,
  applyDemoPathPose,
  applyReturnTransitionPose,
  captureCameraPose,
  type ReturnTransition,
} from "./cameraMotion"
import { CAMERA_DIRECTOR_FRAME_PRIORITY, DEMO_IDLE_DELAY_SECONDS } from "./cameraConfig"
import { DEMO_CAMERA_PATHS, getDemoCameraPath } from "./demoPaths"
import type { CameraPose } from "./gameplayCameraPose"

type CameraDirectorMode = "fixed" | "demo" | "returning"

interface UseCameraDirectorOptions {
  gameplayPose: CameraPose
  orbitControlsEnabled: boolean
}

const isPreGamePhase = (phase: GamePhase): boolean =>
  phase === GAME_PHASE.Idle ||
  phase === GAME_PHASE.ModeSelect ||
  phase === GAME_PHASE.CharacterSelect

export const useCameraDirector = ({
  gameplayPose,
  orbitControlsEnabled,
}: UseCameraDirectorOptions): void => {
  const getThreeState = useThree((state) => state.get)
  const phase = useGameStore((state) => state.phase)

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

    const complete = applyReturnTransitionPose(camera, transition, gameplayPoseRef.current, delta)
    if (!complete) return

    applyCameraPose(camera, gameplayPoseRef.current)
    modeRef.current = "fixed"
    returnTransitionRef.current = null
    fixedPoseAppliedRef.current = true
  }, CAMERA_DIRECTOR_FRAME_PRIORITY)
}
