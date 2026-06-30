import { describe, expect, it } from "vitest"
import { ParticleBurstPool } from "@/components/vfx/particles/particleBurstPool"

const seed = (x: number, life = 1) => ({
  position: { x, y: 0, z: 0 },
  velocity: { x: 1, y: 0, z: 0 },
  color: { r: 1, g: 1, b: 1 },
  life,
  size: 0.05,
  alpha: 1,
  drag: 1,
})

describe("ParticleBurstPool", () => {
  it("keeps active particles capped to the pool size", () => {
    const pool = new ParticleBurstPool(3)

    for (let i = 0; i < 8; i += 1) {
      pool.emitParticle(seed(i), i)
    }

    expect(pool.getActiveCount()).toBe(3)
  })

  it("recycles the oldest particle when the pool is full", () => {
    const pool = new ParticleBurstPool(3)

    pool.emitParticle(seed(1), 1)
    pool.emitParticle(seed(2), 2)
    pool.emitParticle(seed(3), 3)
    pool.emitParticle(seed(4), 4)

    expect(pool.getDebugParticle(0)).toMatchObject({ active: true, bornAt: 4 })
    expect(pool.getActiveCount()).toBe(3)
  })

  it("expires particles when their lifetime elapses", () => {
    const pool = new ParticleBurstPool(4)

    pool.emitParticle(seed(1, 0.1), 0)
    expect(pool.getActiveCount()).toBe(1)

    pool.update(0.11)

    expect(pool.getActiveCount()).toBe(0)
    expect(pool.getDebugParticle(0)).toMatchObject({ active: false, alpha: 0 })
  })

  it("uses the fallback color when a burst has no explicit color", () => {
    const pool = new ParticleBurstPool(16)

    pool.emitBurst(
      {
        kind: "target",
        position: { x: 0, y: 0, z: 0 },
        intensity: 1,
      },
      "#123456",
    )

    expect(pool.colors[0]).toBeCloseTo((0x12 / 255) * 3.2)
    expect(pool.colors[1]).toBeCloseTo((0x34 / 255) * 3.2)
    expect(pool.colors[2]).toBeCloseTo((0x56 / 255) * 3.2)
  })
})
