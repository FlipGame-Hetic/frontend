import type { Position3Type } from "@/types/worldTypes"
import type { Vector3Like } from "three"
import { setRgbFromColor, type MutableRgb } from "../../vfx/particles/particleColor"
import { PLUNGER_VFX_HDR_FACTOR } from "./plungerVfxConfig"

// The fixed spawn frame, the lane front plus the axis and two perpendicular axes the emitters scatter particles around
export interface PlungerParticleFrame {
  front: Position3Type
  axis: Position3Type
  basisA: Position3Type
  basisB: Position3Type
  span: number
}

export interface PlungerParticleDebugStats {
  activeCount: number
  launchBurstCount: number
}

// Hard cap on live particles, every typed array below is sized to this
const PLUNGER_PARTICLE_MAX = 180
// Particle kinds, 0 means a free slot, the rest tag what a particle is for
const IDLE_KIND = 1
const CHARGE_KIND = 2
const LAUNCH_KIND = 3
// Soft caps so each kind cannot fill the whole pool on its own
const IDLE_MAX = 14
const CHARGE_MAX = 36
// One launch fires this many particles at once
const LAUNCH_COUNT = 108
// How far back along the lane the launch burst spreads its spawn points
const LAUNCH_WAVE_LENGTH = 7.2
const TAU = Math.PI * 2

// A preallocated particle pool, it never creates objects at runtime, it just reuses slots in flat typed arrays the GPU reads from directly
export class PlungerParticlePool {
  // These three are read straight by the geometry attributes, 3 floats per position, 4 per color (rgba), 1 per size
  readonly positions = new Float32Array(PLUNGER_PARTICLE_MAX * 3)
  readonly colors = new Float32Array(PLUNGER_PARTICLE_MAX * 4)
  readonly sizes = new Float32Array(PLUNGER_PARTICLE_MAX)

  // CPU-only state kept in parallel arrays, same index as the buffers above
  private readonly velocities = new Float32Array(PLUNGER_PARTICLE_MAX * 3)
  private readonly ages = new Float32Array(PLUNGER_PARTICLE_MAX)
  private readonly lifetimes = new Float32Array(PLUNGER_PARTICLE_MAX)
  // Base size and alpha kept so the per-frame fade can scale from the original value
  private readonly baseSizes = new Float32Array(PLUNGER_PARTICLE_MAX)
  private readonly baseAlphas = new Float32Array(PLUNGER_PARTICLE_MAX)
  // Kind per slot, 0 marks the slot as free
  private readonly kinds = new Uint8Array(PLUNGER_PARTICLE_MAX)
  // Reused color object so converting the css color string never allocates per frame
  private readonly colorScratch: MutableRgb = { r: 1, g: 0.667, b: 0 }

  // Where the next slot search starts, walked round-robin through the pool
  private cursor = 0
  // Spacing timers, an emitter only fires once its timer has built up enough
  private idleTimer = 0
  private chargeTimer = 0
  // Last launch token handled, so a held launch state cannot keep firing bursts
  private lastLaunchToken = 0
  private launchBurstCount = 0

  constructor(private readonly frame: PlungerParticleFrame) {}

  getDebugStats(): PlungerParticleDebugStats {
    return {
      activeCount: this.getActiveCount(),
      launchBurstCount: this.launchBurstCount,
    }
  }

  // Advances every live particle one frame and spawns new ones, returns whether any buffer changed so the caller can skip the GPU upload when nothing moved
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

    // Emits launch particles only when the token changes to ensure a held launch state cannot retrigger the burst
    if (launchToken !== this.lastLaunchToken) {
      this.lastLaunchToken = launchToken
      // token 0 is the initial value, only real launches start at 1
      if (launchToken > 0) {
        this.emitLaunch(launchCharge)
        this.launchBurstCount += 1
        changed = true
      }
    }

    // Drip a few idle sparks at rest, but stop once the idle cap is reached
    const idleCount = this.countKind(IDLE_KIND)
    if (idleCount < IDLE_MAX) {
      this.idleTimer += delta
      // One idle particle every 0.18s
      if (this.idleTimer >= 0.18) {
        this.idleTimer = 0
        this.emitIdle(elapsedTime)
        changed = true
      }
    }

    // Above a tiny deadzone, emit charge sparks, the more charged the faster the timer fills so they come quicker
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

  // Moves each live particle by its velocity, ages it, fades its size and alpha, and frees it once it outlives its lifetime
  private updateActive(delta: number): boolean {
    let changed = false
    for (let i = 0; i < PLUNGER_PARTICLE_MAX; i += 1) {
      if (!this.kinds[i]) continue

      changed = true
      const age = (this.ages[i] ?? 0) + delta
      const life = this.lifetimes[i] ?? 0
      // Lived past its lifetime, free the slot for reuse
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

      // fade runs from 1 at birth to 0 at death, alpha fades on the square for a softer tail, size shrinks but never below 45%
      const fade = 1 - age / life
      this.colors[ci + 3] = (this.baseAlphas[i] ?? 0) * fade * fade
      this.sizes[i] = (this.baseSizes[i] ?? 0) * (0.45 + fade * 0.55)
    }
    return changed
  }

  // Idle spark, drifts slowly around the lane in a lazy swirl, low and calm
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

  // Charge spark, spawns out on a ring then pulls inward and up the axis, faster and tighter the more charged the plunger is
  private emitCharge(charge: number, time: number): void {
    const angle = Math.random() * TAU
    const t = 0.18 + Math.random() * 0.72
    const radius = 0.28 + Math.random() * 0.32
    // How hard it pulls toward the axis and how fast it travels along it, both grow with charge
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

  // Launch burst, spawns the whole wave at once, a fan of sparks shooting up the lane and spraying out to the sides
  private emitLaunch(charge: number): void {
    for (let i = 0; i < LAUNCH_COUNT; i += 1) {
      // Half the sparks go left, half right
      const sideSign = Math.random() < 0.5 ? -1 : 1
      // How far back up the lane this spark starts, wave is that distance as a 0 to 1 fraction
      const along = Math.random() * LAUNCH_WAVE_LENGTH
      const wave = along / LAUNCH_WAVE_LENGTH
      // Sparks farther up the lane start wider and fan out more, scaled by charge
      const sideOffset = sideSign * (0.08 + wave * (0.55 + charge * 0.35) + Math.random() * 0.18)
      const neckScatter = (Math.random() - 0.5) * 0.12
      const sideSpeed = sideSign * (2.3 + charge * 3.1 + Math.random() * 1.6) * (0.7 + wave * 0.6)
      // Negative so the sparks drift up the lane against the axis, harder with charge
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

  // Writes a particle into a free slot, its start position is built from a point along the lane (t and span) plus a ring offset around the axis (radius and angle)
  private emitParticle(
    kind: number,
    t: number,
    radius: number,
    angle: number,
    velocity: Vector3Like,
    life: number,
    size: number,
    alpha: number,
  ): void {
    const slot = this.acquireSlot()
    const pi = slot * 3
    const ci = slot * 4
    // Split the ring offset onto the two perpendicular axes so the particle sits on a circle around the lane axis
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
    // Push the color past 1 with the HDR factor so the bloom pass makes the spark glow
    this.colors[ci] = this.colorScratch.r * PLUNGER_VFX_HDR_FACTOR
    this.colors[ci + 1] = this.colorScratch.g * PLUNGER_VFX_HDR_FACTOR
    this.colors[ci + 2] = this.colorScratch.b * PLUNGER_VFX_HDR_FACTOR
    this.colors[ci + 3] = alpha
    this.sizes[slot] = size
  }

  // Same as emitParticle but takes an explicit world position, the launch burst builds its own spawn points so it skips the ring layout
  private emitParticleAtPosition(
    kind: number,
    position: Vector3Like,
    velocity: Vector3Like,
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

  // Finds a free slot by walking round-robin from the cursor, the modulo wraps the search back to the start of the pool
  private acquireSlot(): number {
    for (let step = 0; step < PLUNGER_PARTICLE_MAX; step += 1) {
      const candidate = (this.cursor + step) % PLUNGER_PARTICLE_MAX
      if (!this.kinds[candidate]) {
        this.cursor = (candidate + 1) % PLUNGER_PARTICLE_MAX
        return candidate
      }
    }

    // Pool is full, overwrite the oldest spot under the cursor so a launch is never dropped
    const slot = this.cursor
    this.cursor = (this.cursor + 1) % PLUNGER_PARTICLE_MAX
    return slot
  }

  // Counts live particles of one kind, used to enforce the per-kind soft caps
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

  // Frees a slot, marking the kind 0 makes acquireSlot reuse it, and zeroing the size and alpha hides it on the GPU
  private deactivate(index: number): void {
    this.kinds[index] = 0
    this.sizes[index] = 0
    this.colors[index * 4 + 3] = 0
  }
}
