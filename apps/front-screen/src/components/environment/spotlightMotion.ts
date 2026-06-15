import * as THREE from "three"
import {
  SPOT_BURST_DURATION,
  SPOT_BURST_INTERVAL_MAX,
  SPOT_BURST_INTERVAL_MIN,
  SPOT_BURST_SPEED,
  SPOT_DRIFT_SPEED,
  SPOT_TARGET_MAX,
  SPOT_TARGET_MIN,
} from "@/audio/audioReactiveConfig"

export interface SpotlightMotion {
  current: THREE.Vector3
  dest: THREE.Vector3
  burstTimer: number
  burstRemaining: number
}

const randRange = (min: number, max: number): number => min + Math.random() * (max - min)

const randomPoint = (out: THREE.Vector3): THREE.Vector3 =>
  out.set(
    randRange(SPOT_TARGET_MIN[0], SPOT_TARGET_MAX[0]),
    randRange(SPOT_TARGET_MIN[1], SPOT_TARGET_MAX[1]),
    randRange(SPOT_TARGET_MIN[2], SPOT_TARGET_MAX[2]),
  )

export const createSpotlightMotion = (): SpotlightMotion => {
  const current = randomPoint(new THREE.Vector3())
  const dest = randomPoint(new THREE.Vector3())
  return {
    current,
    dest,
    burstTimer: randRange(SPOT_BURST_INTERVAL_MIN, SPOT_BURST_INTERVAL_MAX),
    burstRemaining: 0,
  }
}

// Dérive lente par défaut ; emballements occasionnels (zone qui balaye vite
// d'autres endroits) déclenchés par un timer pseudo-aléatoire, non lié à la musique.
export const updateSpotlightMotion = (
  motion: SpotlightMotion,
  dt: number,
  out: THREE.Vector3,
): void => {
  const bursting = motion.burstRemaining > 0
  if (bursting) {
    motion.burstRemaining -= dt
  } else {
    motion.burstTimer -= dt
    if (motion.burstTimer <= 0) {
      motion.burstRemaining = SPOT_BURST_DURATION
      motion.burstTimer = randRange(SPOT_BURST_INTERVAL_MIN, SPOT_BURST_INTERVAL_MAX)
    }
  }

  const reachThreshold = bursting ? 1.2 : 0.3
  if (motion.current.distanceTo(motion.dest) < reachThreshold) randomPoint(motion.dest)

  const speed = bursting ? SPOT_BURST_SPEED : SPOT_DRIFT_SPEED
  motion.current.lerp(motion.dest, 1 - Math.exp(-speed * dt))
  out.copy(motion.current)
}
