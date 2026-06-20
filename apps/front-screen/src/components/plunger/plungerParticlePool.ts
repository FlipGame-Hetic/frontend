import { PLUNGER_VFX_HDR_FACTOR } from "./plungerVfxConfig"
import { setRgbFromColor, type MutableRgb } from "../vfx/particleColor"

interface ParticleVector {
  x: number
  y: number
  z: number
}

export interface PlungerParticleFrame {
  front: ParticleVector
  axis: ParticleVector
  basisA: ParticleVector
  basisB: ParticleVector
  span: number
}

export interface PlungerParticleDebugStats {
  activeCount: number
  launchBurstCount: number
}

const PLUNGER_PARTICLE_MAX = 180
const IDLE_KIND = 1
const CHARGE_KIND = 2
const LAUNCH_KIND = 3
const IDLE_MAX = 14
const CHARGE_MAX = 36
const LAUNCH_COUNT = 108
const LAUNCH_WAVE_LENGTH = 7.2
const TAU = Math.PI * 2

export class PlungerParticlePool {
  readonly positions = new Float32Array(PLUNGER_PARTICLE_MAX * 3)
  readonly colors = new Float32Array(PLUNGER_PARTICLE_MAX * 4)
  readonly sizes = new Float32Array(PLUNGER_PARTICLE_MAX)

  private readonly velocities = new Float32Array(PLUNGER_PARTICLE_MAX * 3)
  private readonly ages = new Float32Array(PLUNGER_PARTICLE_MAX)
  private readonly lifetimes = new Float32Array(PLUNGER_PARTICLE_MAX)
  private readonly baseSizes = new Float32Array(PLUNGER_PARTICLE_MAX)
  private readonly baseAlphas = new Float32Array(PLUNGER_PARTICLE_MAX)
  private readonly kinds = new Uint8Array(PLUNGER_PARTICLE_MAX)
  private readonly colorScratch: MutableRgb = { r: 1, g: 0.667, b: 0 }

  private cursor = 0
  private idleTimer = 0
  private chargeTimer = 0
  private lastLaunchToken = 0
  private launchBurstCount = 0

  constructor(private readonly frame: PlungerParticleFrame) {}

  getDebugStats(): PlungerParticleDebugStats {
    return {
      activeCount: this.getActiveCount(),
      launchBurstCount: this.launchBurstCount,
    }
  }

  update(
    delta: number,
    elapsedTime: number,
    charge: number,
    launchToken: number,
    launchCharge: number,
    color: string,
  ): boolean {
    let changed = this.updateActive(delta)
    setRgbFromColor(color, undefined, this.colorScratch)

    // Emits launch particles only when the token changes to ensure a held launch state cannot retrigger the burst.
    if (launchToken !== this.lastLaunchToken) {
      this.lastLaunchToken = launchToken
      if (launchToken > 0) {
        this.emitLaunch(launchCharge)
        this.launchBurstCount += 1
        changed = true
      }
    }

    const idleCount = this.countKind(IDLE_KIND)
    if (idleCount < IDLE_MAX) {
      this.idleTimer += delta
      if (this.idleTimer >= 0.18) {
        this.idleTimer = 0
        this.emitIdle(elapsedTime)
        changed = true
      }
    }

    if (charge > 0.04) {
      const chargeCount = this.countKind(CHARGE_KIND)
      this.chargeTimer += delta * (1 + charge * 4)
      if (chargeCount < CHARGE_MAX && this.chargeTimer >= 0.08) {
        this.chargeTimer = 0
        this.emitCharge(charge, elapsedTime)
        changed = true
      }
    } else {
      this.chargeTimer = 0
    }

    return changed
  }

  private updateActive(delta: number): boolean {
    let changed = false
    for (let i = 0; i < PLUNGER_PARTICLE_MAX; i += 1) {
      if (!this.kinds[i]) continue

      changed = true
      const age = (this.ages[i] ?? 0) + delta
      const life = this.lifetimes[i] ?? 0
      if (age >= life) {
        this.deactivate(i)
        continue
      }

      this.ages[i] = age
      const pi = i * 3
      const ci = i * 4
      this.positions[pi] = (this.positions[pi] ?? 0) + (this.velocities[pi] ?? 0) * delta
      this.positions[pi + 1] =
        (this.positions[pi + 1] ?? 0) + (this.velocities[pi + 1] ?? 0) * delta
      this.positions[pi + 2] =
        (this.positions[pi + 2] ?? 0) + (this.velocities[pi + 2] ?? 0) * delta

      const fade = 1 - age / life
      this.colors[ci + 3] = (this.baseAlphas[i] ?? 0) * fade * fade
      this.sizes[i] = (this.baseSizes[i] ?? 0) * (0.45 + fade * 0.55)
    }
    return changed
  }

  private emitIdle(time: number): void {
    const angle = Math.random() * TAU
    const t = 0.08 + Math.random() * 0.84
    const radius = 0.16 + Math.random() * 0.22
    const swirl = 0.08 + Math.sin(time + t * TAU) * 0.025
    this.emitParticle(
      IDLE_KIND,
      t,
      radius,
      angle,
      {
        x: (-Math.sin(angle) * this.frame.basisA.x + Math.cos(angle) * this.frame.basisB.x) * swirl,
        y: (-Math.sin(angle) * this.frame.basisA.y + Math.cos(angle) * this.frame.basisB.y) * swirl,
        z: (-Math.sin(angle) * this.frame.basisA.z + Math.cos(angle) * this.frame.basisB.z) * swirl,
      },
      1.45 + Math.random() * 0.55,
      0.024,
      0.18,
    )
  }

  private emitCharge(charge: number, time: number): void {
    const angle = Math.random() * TAU
    const t = 0.18 + Math.random() * 0.72
    const radius = 0.28 + Math.random() * 0.32
    const inward = 0.42 + charge * 0.52
    const axial = 0.32 + charge * 0.85
    const wobble = Math.sin(time * 8 + angle) * 0.08
    this.emitParticle(
      CHARGE_KIND,
      t,
      radius,
      angle,
      {
        x:
          this.frame.axis.x * axial -
          (Math.cos(angle) * this.frame.basisA.x + Math.sin(angle) * this.frame.basisB.x) * inward +
          this.frame.basisB.x * wobble,
        y:
          this.frame.axis.y * axial -
          (Math.cos(angle) * this.frame.basisA.y + Math.sin(angle) * this.frame.basisB.y) * inward +
          this.frame.basisB.y * wobble,
        z:
          this.frame.axis.z * axial -
          (Math.cos(angle) * this.frame.basisA.z + Math.sin(angle) * this.frame.basisB.z) * inward +
          this.frame.basisB.z * wobble,
      },
      0.62 + Math.random() * 0.28,
      0.042 + charge * 0.025,
      0.34 + charge * 0.42,
    )
  }

  private emitLaunch(charge: number): void {
    for (let i = 0; i < LAUNCH_COUNT; i += 1) {
      const sideSign = Math.random() < 0.5 ? -1 : 1
      const along = Math.random() * LAUNCH_WAVE_LENGTH
      const wave = along / LAUNCH_WAVE_LENGTH
      const sideOffset = sideSign * (0.08 + wave * (0.55 + charge * 0.35) + Math.random() * 0.18)
      const neckScatter = (Math.random() - 0.5) * 0.12
      const sideSpeed = sideSign * (2.3 + charge * 3.1 + Math.random() * 1.6) * (0.7 + wave * 0.6)
      const beamDrift = -(1.2 + charge * 2.4 + Math.random() * 1.5)
      const crossDrift = (Math.random() - 0.5) * 0.42
      const origin = {
        x:
          this.frame.front.x -
          this.frame.axis.x * along +
          this.frame.basisA.x * sideOffset +
          this.frame.basisB.x * neckScatter,
        y:
          this.frame.front.y -
          this.frame.axis.y * along +
          this.frame.basisA.y * sideOffset +
          this.frame.basisB.y * neckScatter,
        z:
          this.frame.front.z -
          this.frame.axis.z * along +
          this.frame.basisA.z * sideOffset +
          this.frame.basisB.z * neckScatter,
      }

      this.emitParticleAtPosition(
        LAUNCH_KIND,
        origin,
        {
          x:
            this.frame.basisA.x * sideSpeed +
            this.frame.axis.x * beamDrift +
            this.frame.basisB.x * crossDrift,
          y:
            this.frame.basisA.y * sideSpeed +
            this.frame.axis.y * beamDrift +
            this.frame.basisB.y * crossDrift,
          z:
            this.frame.basisA.z * sideSpeed +
            this.frame.axis.z * beamDrift +
            this.frame.basisB.z * crossDrift,
        },
        0.58 + Math.random() * 0.24,
        0.07 + charge * 0.04 + Math.random() * 0.02,
        0.82 + charge * 0.32,
      )
    }
  }

  private emitParticle(
    kind: number,
    t: number,
    radius: number,
    angle: number,
    velocity: ParticleVector,
    life: number,
    size: number,
    alpha: number,
  ): void {
    const slot = this.acquireSlot()
    const pi = slot * 3
    const ci = slot * 4
    const radialA = Math.cos(angle) * radius
    const radialB = Math.sin(angle) * radius

    this.kinds[slot] = kind
    this.ages[slot] = 0
    this.lifetimes[slot] = life
    this.baseSizes[slot] = size
    this.baseAlphas[slot] = alpha
    this.positions[pi] =
      this.frame.front.x +
      this.frame.axis.x * this.frame.span * t +
      this.frame.basisA.x * radialA +
      this.frame.basisB.x * radialB
    this.positions[pi + 1] =
      this.frame.front.y +
      this.frame.axis.y * this.frame.span * t +
      this.frame.basisA.y * radialA +
      this.frame.basisB.y * radialB
    this.positions[pi + 2] =
      this.frame.front.z +
      this.frame.axis.z * this.frame.span * t +
      this.frame.basisA.z * radialA +
      this.frame.basisB.z * radialB
    this.velocities[pi] = velocity.x
    this.velocities[pi + 1] = velocity.y
    this.velocities[pi + 2] = velocity.z
    this.colors[ci] = this.colorScratch.r * PLUNGER_VFX_HDR_FACTOR
    this.colors[ci + 1] = this.colorScratch.g * PLUNGER_VFX_HDR_FACTOR
    this.colors[ci + 2] = this.colorScratch.b * PLUNGER_VFX_HDR_FACTOR
    this.colors[ci + 3] = alpha
    this.sizes[slot] = size
  }

  private emitParticleAtPosition(
    kind: number,
    position: ParticleVector,
    velocity: ParticleVector,
    life: number,
    size: number,
    alpha: number,
  ): void {
    const slot = this.acquireSlot()
    const pi = slot * 3
    const ci = slot * 4

    this.kinds[slot] = kind
    this.ages[slot] = 0
    this.lifetimes[slot] = life
    this.baseSizes[slot] = size
    this.baseAlphas[slot] = alpha
    this.positions[pi] = position.x
    this.positions[pi + 1] = position.y
    this.positions[pi + 2] = position.z
    this.velocities[pi] = velocity.x
    this.velocities[pi + 1] = velocity.y
    this.velocities[pi + 2] = velocity.z
    this.colors[ci] = this.colorScratch.r * PLUNGER_VFX_HDR_FACTOR
    this.colors[ci + 1] = this.colorScratch.g * PLUNGER_VFX_HDR_FACTOR
    this.colors[ci + 2] = this.colorScratch.b * PLUNGER_VFX_HDR_FACTOR
    this.colors[ci + 3] = alpha
    this.sizes[slot] = size
  }

  private acquireSlot(): number {
    for (let step = 0; step < PLUNGER_PARTICLE_MAX; step += 1) {
      const candidate = (this.cursor + step) % PLUNGER_PARTICLE_MAX
      if (!this.kinds[candidate]) {
        this.cursor = (candidate + 1) % PLUNGER_PARTICLE_MAX
        return candidate
      }
    }

    const slot = this.cursor
    this.cursor = (this.cursor + 1) % PLUNGER_PARTICLE_MAX
    return slot
  }

  private countKind(kind: number): number {
    let count = 0
    for (let i = 0; i < PLUNGER_PARTICLE_MAX; i += 1) {
      if (this.kinds[i] === kind) count += 1
    }
    return count
  }

  private getActiveCount(): number {
    let count = 0
    for (let i = 0; i < PLUNGER_PARTICLE_MAX; i += 1) {
      if (this.kinds[i]) count += 1
    }
    return count
  }

  private deactivate(index: number): void {
    this.kinds[index] = 0
    this.sizes[index] = 0
    this.colors[index * 4 + 3] = 0
  }
}
