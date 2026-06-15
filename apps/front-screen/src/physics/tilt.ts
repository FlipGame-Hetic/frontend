import { getBallBodies } from "@/components/balls/ballBodyRegistry"
import useScreenShakeStore from "@/stores/useScreenShakeStore"
import { projectOnPlayfield } from "@/components/physics/playfieldPlane"
import {
  NUDGE_IMPULSE,
  NUDGE_TRAUMA,
  TILT_COOLDOWN_MS,
  TILT_THRESHOLD,
  TILT_WINDOW_MS,
} from "./tiltConfig"

let tiltTimestamps: number[] = []
let tiltLocked = false
let lastNudge = 0

const nudgeDirection = (ax: number, ay: number): { x: number; y: number; z: number } => {
  const dir = projectOnPlayfield({ x: ax, y: 0, z: ay })
  const mag = Math.hypot(dir.x, dir.y, dir.z)
  if (mag < 0.001) return { x: 1, y: 0, z: 0 }
  return { x: dir.x / mag, y: dir.y / mag, z: dir.z / mag }
}

export const applyNudge = (ax: number, ay: number): void => {
  const now = performance.now()
  if (now - lastNudge < TILT_COOLDOWN_MS) return
  lastNudge = now

  const dir = nudgeDirection(ax, ay)
  for (const body of getBallBodies()) {
    const scale = NUDGE_IMPULSE * body.mass()
    body.applyImpulse({ x: dir.x * scale, y: dir.y * scale, z: dir.z * scale }, true)
  }

  useScreenShakeStore.getState().addTrauma(NUDGE_TRAUMA)

  tiltTimestamps = tiltTimestamps.filter((t) => now - t < TILT_WINDOW_MS)
  tiltTimestamps.push(now)
  if (tiltTimestamps.length >= TILT_THRESHOLD) {
    tiltLocked = true
  }
}

export const isTiltLocked = (): boolean => tiltLocked

export const resetTilt = (): void => {
  tiltTimestamps = []
  tiltLocked = false
}
