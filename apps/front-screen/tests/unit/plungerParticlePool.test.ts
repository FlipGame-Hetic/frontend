import { describe, expect, it } from "vitest"
import {
  PlungerParticlePool,
  type PlungerParticleFrame,
} from "@/components/plunger/plungerParticlePool"

const frame: PlungerParticleFrame = {
  front: { x: 0, y: 0, z: 0 },
  axis: { x: 0, y: 0, z: 1 },
  basisA: { x: 1, y: 0, z: 0 },
  basisB: { x: 0, y: 1, z: 0 },
  span: 1,
}

describe("PlungerParticlePool", () => {
  it("emits a launch burst once per launch token", () => {
    const pool = new PlungerParticlePool(frame)

    pool.update(0, 0, 0, 0, 0, "#FFAA00")
    expect(pool.getDebugStats().launchBurstCount).toBe(0)

    pool.update(0, 0, 0, 1, 0.8, "#FFAA00")
    expect(pool.getDebugStats()).toMatchObject({
      activeCount: 108,
      launchBurstCount: 1,
    })

    pool.update(0, 0, 0, 1, 0.8, "#FFAA00")
    expect(pool.getDebugStats()).toMatchObject({
      activeCount: 108,
      launchBurstCount: 1,
    })

    pool.update(0, 0, 0, 2, 1, "#FFAA00")
    expect(pool.getDebugStats()).toMatchObject({
      activeCount: 180,
      launchBurstCount: 2,
    })
  })
})
