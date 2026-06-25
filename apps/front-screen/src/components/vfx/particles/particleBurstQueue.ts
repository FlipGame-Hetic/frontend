import { MAX_QUEUED_BURSTS, type ParticleBurstKind } from "../particleBurstConfig"

export interface ParticleBurstVector {
  x: number
  y: number
  z: number
}

export interface ParticleBurstRequest {
  kind: ParticleBurstKind
  position: ParticleBurstVector
  direction?: ParticleBurstVector
  intensity?: number
  color?: string
}

export interface QueuedParticleBurst {
  kind: ParticleBurstKind
  position: ParticleBurstVector
  direction?: ParticleBurstVector
  intensity: number
  color?: string
}

const burstQueue: QueuedParticleBurst[] = []

const copyVector = (value: ParticleBurstVector): ParticleBurstVector => ({
  x: value.x,
  y: value.y,
  z: value.z,
})

export const emitParticleBurst = (request: ParticleBurstRequest): void => {
  if (burstQueue.length >= MAX_QUEUED_BURSTS) {
    // Shifts queued bursts left before trimming to ensure overflow keeps the newest collision bursts.
    burstQueue.copyWithin(0, 1)
    burstQueue.length = MAX_QUEUED_BURSTS - 1
  }

  // Copies request vectors into the queue to ensure later caller mutations cannot move the burst.
  burstQueue.push({
    kind: request.kind,
    position: copyVector(request.position),
    direction: request.direction ? copyVector(request.direction) : undefined,
    intensity: Math.max(request.intensity ?? 1, 0),
    color: request.color,
  })
}

export const consumeParticleBursts = (handler: (burst: QueuedParticleBurst) => void): number => {
  // Drains a snapshot before calling handlers to ensure bursts emitted by handlers stay queued.
  const bursts = burstQueue.splice(0, burstQueue.length)
  const count = bursts.length
  for (let i = 0; i < count; i += 1) {
    const burst = bursts[i]
    if (burst) handler(burst)
  }
  return count
}

export const getParticleBurstQueueSize = (): number => burstQueue.length

export const clearParticleBurstQueue = (): void => {
  burstQueue.length = 0
}
