import type { Vector3Like } from "three"
import {
  MAX_GLOBAL_PARTICLES,
  PARTICLE_BURST_CONFIG,
  PARTICLE_BURST_HDR_FACTOR,
} from "../particleBurstConfig"
import type { QueuedParticleBurst } from "./particleBurstQueue"
import { setRgbFromColor, type MutableRgb } from "./particleColor"

interface ParticleSeed {
  position: Vector3Like
  velocity: Vector3Like
  color: MutableRgb
  life: number
  size: number
  alpha: number
  drag: number
}

export interface ParticleDebugSnapshot {
  active: boolean
  age: number
  bornAt: number
  life: number
  alpha: number
}

const TAU = Math.PI * 2
const DEFAULT_COLOR = "#FFAA00"

export class ParticleBurstPool {
  readonly maxParticles: number
  readonly positions: Float32Array
  readonly colors: Float32Array
  readonly sizes: Float32Array

  private readonly velocities: Float32Array
  private readonly ages: Float32Array
  private readonly lifetimes: Float32Array
  private readonly baseSizes: Float32Array
  private readonly baseAlphas: Float32Array
  private readonly drags: Float32Array
  private readonly active: Uint8Array
  private readonly bornAt: Float32Array
  private readonly colorScratch: MutableRgb = { r: 1, g: 0.667, b: 0 }
  private cursor = 0

  constructor(maxParticles = MAX_GLOBAL_PARTICLES) {
    this.maxParticles = maxParticles
    this.positions = new Float32Array(maxParticles * 3)
    this.colors = new Float32Array(maxParticles * 4)
    this.sizes = new Float32Array(maxParticles)
    this.velocities = new Float32Array(maxParticles * 3)
    this.ages = new Float32Array(maxParticles)
    this.lifetimes = new Float32Array(maxParticles)
    this.baseSizes = new Float32Array(maxParticles)
    this.baseAlphas = new Float32Array(maxParticles)
    this.drags = new Float32Array(maxParticles)
    this.active = new Uint8Array(maxParticles)
    this.bornAt = new Float32Array(maxParticles)
  }

  getActiveCount(): number {
    let count = 0
    for (let i = 0; i < this.maxParticles; i += 1) {
      if (this.active[i]) count += 1
    }
    return count
  }

  getDebugParticle(index: number): ParticleDebugSnapshot | null {
    if (index < 0 || index >= this.maxParticles) return null
    return {
      active: this.active[index] === 1,
      age: this.ages[index] ?? 0,
      bornAt: this.bornAt[index] ?? 0,
      life: this.lifetimes[index] ?? 0,
      alpha: this.colors[index * 4 + 3] ?? 0,
    }
  }

  emitParticle(seed: ParticleSeed, now = 0): number {
    const slot = this.acquireSlot(now)
    const pi = slot * 3
    const ci = slot * 4

    this.active[slot] = 1
    this.bornAt[slot] = now
    this.ages[slot] = 0
    this.lifetimes[slot] = seed.life
    this.baseSizes[slot] = seed.size
    this.baseAlphas[slot] = seed.alpha
    this.drags[slot] = seed.drag

    this.positions[pi] = seed.position.x
    this.positions[pi + 1] = seed.position.y
    this.positions[pi + 2] = seed.position.z
    this.velocities[pi] = seed.velocity.x
    this.velocities[pi + 1] = seed.velocity.y
    this.velocities[pi + 2] = seed.velocity.z
    this.colors[ci] = seed.color.r * PARTICLE_BURST_HDR_FACTOR
    this.colors[ci + 1] = seed.color.g * PARTICLE_BURST_HDR_FACTOR
    this.colors[ci + 2] = seed.color.b * PARTICLE_BURST_HDR_FACTOR
    this.colors[ci + 3] = seed.alpha
    this.sizes[slot] = seed.size

    return slot
  }

  emitBurst(burst: QueuedParticleBurst, fallbackColor = DEFAULT_COLOR, now = 0): number {
    const config = PARTICLE_BURST_CONFIG[burst.kind]
    const intensity = Math.max(burst.intensity, 0)
    if (intensity <= 0) return 0

    setRgbFromColor(burst.color, fallbackColor, this.colorScratch)

    const count = Math.max(1, Math.round(config.count * Math.min(intensity, 2)))
    const direction = burst.direction
    const hasDirection = direction !== undefined
    let dirX = hasDirection ? direction.x : 0
    let dirY = hasDirection ? direction.y : 0
    let dirZ = hasDirection ? direction.z : 0
    const len = Math.hypot(dirX, dirY, dirZ)
    // Normalizes the optional burst direction to ensure caller vector length cannot scale particle speed
    if (len > 0.0001) {
      dirX /= len
      dirY /= len
      dirZ /= len
    } else {
      dirX = 0
      dirY = 0
      dirZ = 0
    }

    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * TAU
      const radial = Math.random() * config.spread
      const lift = config.lift * (0.65 + Math.random() * 0.7)
      const speed = config.speed * (0.65 + Math.random() * 0.7) * Math.min(intensity, 1.6)
      const jitter = 0.035
      const rx = Math.cos(angle)
      const rz = Math.sin(angle)
      const sx = hasDirection ? dirX + rx * radial : rx
      const sy = hasDirection ? dirY + lift + (Math.random() - 0.5) * radial : lift
      const sz = hasDirection ? dirZ + rz * radial : rz

      this.emitParticle(
        {
          position: {
            x: burst.position.x + (Math.random() - 0.5) * jitter,
            y: burst.position.y + (Math.random() - 0.5) * jitter,
            z: burst.position.z + (Math.random() - 0.5) * jitter,
          },
          velocity: {
            x: sx * speed,
            y: sy * speed,
            z: sz * speed,
          },
          color: this.colorScratch,
          life: config.life * (0.85 + Math.random() * 0.3),
          size: config.size * (0.75 + Math.random() * 0.5),
          alpha: config.alpha,
          drag: config.drag,
        },
        now,
      )
    }

    return count
  }

  update(delta: number): boolean {
    let changed = false

    for (let i = 0; i < this.maxParticles; i += 1) {
      if (!this.active[i]) continue

      changed = true
      const nextAge = (this.ages[i] ?? 0) + delta
      const life = this.lifetimes[i] ?? 0
      if (nextAge >= life) {
        this.deactivate(i)
        continue
      }

      this.ages[i] = nextAge
      const pi = i * 3
      const ci = i * 4
      const drag = Math.pow(this.drags[i] ?? 1, delta * 60)
      this.velocities[pi] = (this.velocities[pi] ?? 0) * drag
      this.velocities[pi + 1] = (this.velocities[pi + 1] ?? 0) * drag
      this.velocities[pi + 2] = (this.velocities[pi + 2] ?? 0) * drag

      this.positions[pi] = (this.positions[pi] ?? 0) + (this.velocities[pi] ?? 0) * delta
      this.positions[pi + 1] =
        (this.positions[pi + 1] ?? 0) + (this.velocities[pi + 1] ?? 0) * delta
      this.positions[pi + 2] =
        (this.positions[pi + 2] ?? 0) + (this.velocities[pi + 2] ?? 0) * delta

      const k = 1 - nextAge / life
      this.colors[ci + 3] = (this.baseAlphas[i] ?? 0) * k * k
      this.sizes[i] = (this.baseSizes[i] ?? 0) * (0.35 + k * 0.65)
    }

    return changed
  }

  private acquireSlot(now: number): number {
    for (let step = 0; step < this.maxParticles; step += 1) {
      const candidate = (this.cursor + step) % this.maxParticles
      if (!this.active[candidate]) {
        this.cursor = (candidate + 1) % this.maxParticles
        return candidate
      }
    }

    // Reuses the oldest active slot when the pool is full to ensure new bursts stay visible under load
    let oldest = 0
    let oldestTime = Number.POSITIVE_INFINITY
    for (let i = 0; i < this.maxParticles; i += 1) {
      const born = this.bornAt[i] ?? now
      if (born < oldestTime) {
        oldest = i
        oldestTime = born
      }
    }
    this.cursor = (oldest + 1) % this.maxParticles
    return oldest
  }

  private deactivate(index: number): void {
    this.active[index] = 0
    this.sizes[index] = 0
    this.colors[index * 4 + 3] = 0
  }
}
