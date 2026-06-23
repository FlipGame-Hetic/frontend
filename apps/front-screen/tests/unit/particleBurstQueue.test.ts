import { beforeEach, describe, expect, it } from "vitest"
import {
  clearParticleBurstQueue,
  consumeParticleBursts,
  emitParticleBurst,
  getParticleBurstQueueSize,
  type QueuedParticleBurst,
} from "@/components/vfx/particles/particleBurstQueue"

describe("particleBurstQueue", () => {
  beforeEach(() => {
    clearParticleBurstQueue()
  })

  it("queues particle burst requests with default intensity", () => {
    emitParticleBurst({
      kind: "bumper",
      position: { x: 1, y: 2, z: 3 },
    })

    expect(getParticleBurstQueueSize()).toBe(1)
  })

  it("consumes queued bursts and clears the queue", () => {
    const consumed: QueuedParticleBurst[] = []

    emitParticleBurst({
      kind: "slingshot",
      position: { x: 1, y: 2, z: 3 },
      direction: { x: 0, y: 0, z: -1 },
    })
    const count = consumeParticleBursts((burst) => {
      consumed.push(burst)
    })

    expect(count).toBe(1)
    expect(getParticleBurstQueueSize()).toBe(0)
    expect(consumed[0]).toMatchObject({
      kind: "slingshot",
      position: { x: 1, y: 2, z: 3 },
      direction: { x: 0, y: 0, z: -1 },
      intensity: 1,
    })
  })

  it("copies request vectors so later mutations do not leak into the queue", () => {
    const position = { x: 1, y: 2, z: 3 }
    emitParticleBurst({ kind: "target", position })
    position.x = 99

    let consumed: QueuedParticleBurst | null = null
    consumeParticleBursts((burst) => {
      consumed = burst
    })

    expect(consumed).toMatchObject({ position: { x: 1 } })
  })

  it("keeps bursts emitted while consuming queued for the next consume", () => {
    emitParticleBurst({ kind: "bumper", position: { x: 1, y: 2, z: 3 } })

    const firstConsumed: QueuedParticleBurst[] = []
    const firstCount = consumeParticleBursts((burst) => {
      firstConsumed.push(burst)
      emitParticleBurst({ kind: "target", position: { x: 4, y: 5, z: 6 } })
    })

    expect(firstCount).toBe(1)
    expect(firstConsumed).toHaveLength(1)
    expect(getParticleBurstQueueSize()).toBe(1)

    const secondConsumed: QueuedParticleBurst[] = []
    const secondCount = consumeParticleBursts((burst) => {
      secondConsumed.push(burst)
    })

    expect(secondCount).toBe(1)
    expect(secondConsumed.at(0)).toMatchObject({
      kind: "target",
      position: { x: 4, y: 5, z: 6 },
    })
  })
})
