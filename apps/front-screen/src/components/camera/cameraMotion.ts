import { easeInOutCubic, easeInOutSine } from "@/utils/easing"
import { MathUtils, type PerspectiveCamera } from "three"
import { DEMO_TRANSITION_DURATION_SECONDS } from "./cameraConfig"
import { sampleDemoCameraPath, type DemoCameraPath } from "./demoPaths"
import type { CameraPose } from "./gameplayCameraPose"

export interface ReturnTransition {
  elapsed: number
  from: CameraPose
}

export const captureCameraPose = (camera: PerspectiveCamera): CameraPose => ({
  position: camera.position.clone(),
  quaternion: camera.quaternion.clone(),
  fov: camera.fov,
})

export const applyCameraPose = (camera: PerspectiveCamera, pose: CameraPose): void => {
  camera.position.copy(pose.position)
  camera.quaternion.copy(pose.quaternion)
  if (camera.fov !== pose.fov) {
    camera.fov = pose.fov
    camera.updateProjectionMatrix()
  }
}

export const applyDemoPathPose = (
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

export const applyReturnTransitionPose = (
  camera: PerspectiveCamera,
  transition: ReturnTransition,
  targetPose: CameraPose,
  delta: number,
): boolean => {
  transition.elapsed += delta

  const t = easeInOutCubic(
    MathUtils.clamp(transition.elapsed / DEMO_TRANSITION_DURATION_SECONDS, 0, 1),
  )

  camera.position.copy(transition.from.position).lerp(targetPose.position, t)
  camera.quaternion.copy(transition.from.quaternion).slerp(targetPose.quaternion, t)
  camera.fov = MathUtils.lerp(transition.from.fov, targetPose.fov, t)
  camera.updateProjectionMatrix()

  return transition.elapsed >= DEMO_TRANSITION_DURATION_SECONDS
}
