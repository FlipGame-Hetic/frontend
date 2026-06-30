export type ParticleBurstKind = "bumper" | "slimBumper" | "slingshot" | "target"

export interface ParticleBurstKindConfig {
  count: number
  life: number
  speed: number
  spread: number
  size: number
  alpha: number
  lift: number
  drag: number
}

export const MAX_GLOBAL_PARTICLES = 180
export const MAX_QUEUED_BURSTS = 64
export const PARTICLE_BURST_HDR_FACTOR = 3.2

export const PARTICLE_BURST_CONFIG: Record<ParticleBurstKind, ParticleBurstKindConfig> = {
  bumper: {
    count: 22,
    life: 0.34,
    speed: 3.05,
    spread: 0.9,
    size: 0.058,
    alpha: 1,
    lift: 0.28,
    drag: 0.9,
  },
  slimBumper: {
    count: 15,
    life: 0.29,
    speed: 2.55,
    spread: 0.74,
    size: 0.049,
    alpha: 0.9,
    lift: 0.22,
    drag: 0.88,
  },
  slingshot: {
    count: 24,
    life: 0.31,
    speed: 3.45,
    spread: 0.55,
    size: 0.053,
    alpha: 0.96,
    lift: 0.16,
    drag: 0.9,
  },
  target: {
    count: 18,
    life: 0.27,
    speed: 2.2,
    spread: 0.8,
    size: 0.046,
    alpha: 0.86,
    lift: 0.34,
    drag: 0.84,
  },
}
