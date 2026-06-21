import { afterEach, describe, expect, it, vi } from "vitest"
import {
  BONUS_ZONE_SPAWN_INTERVAL_MS,
  MULTIBALL_SPAWN_POSITION1,
  MULTIBALL_SPAWN_POSITION2,
} from "@/components/playfield/bonusZoneConfig"
import { registerBonusZoneHit } from "@/components/playfield/bonusZoneHits"
import useMultiballStore from "@/stores/useMultiballStore"
import useScorePopupsStore from "@/stores/useScorePopupsStore"

const originalRegisterBounce = useMultiballStore.getState().registerBounce

describe("bonusZoneHits", () => {
  afterEach(() => {
    useMultiballStore.setState({ registerBounce: originalRegisterBounce })
    useScorePopupsStore.setState({ popups: [], recentHits: [] })
  })

  it("registers bonus hits through the shared multiball counter", () => {
    const registerBounce = vi.fn()
    useMultiballStore.setState({ registerBounce })

    registerBonusZoneHit("ball-a", { bounceThreshold: 7, ballCount: 4 })

    expect(registerBounce).toHaveBeenCalledWith({
      ballId: "ball-a",
      threshold: 7,
      spawnPositions: [[...MULTIBALL_SPAWN_POSITION1], [...MULTIBALL_SPAWN_POSITION2]],
      spawnIntervalMs: BONUS_ZONE_SPAWN_INTERVAL_MS,
      ballCount: 4,
    })
  })

  it("ignores hits without a ball id", () => {
    const registerBounce = vi.fn()
    useMultiballStore.setState({ registerBounce })

    registerBonusZoneHit("", { bounceThreshold: 7, ballCount: 4 })

    expect(registerBounce).not.toHaveBeenCalled()
  })

  it("spawns the remaining-hit countdown for accepted bonus progress", () => {
    const registerBounce = vi.fn(() => ({ status: "progress" as const, remaining: 8 }))
    const position = { x: 1, y: 2, z: 3 }
    useMultiballStore.setState({ registerBounce })

    registerBonusZoneHit("ball-a", { bounceThreshold: 9, ballCount: 4 }, position)

    expect(useScorePopupsStore.getState().popups.at(-1)).toMatchObject({
      kind: "multiball-countdown",
      text: "8",
      position,
    })
  })

  it("spawns MULTIBALL instead of 0 on the triggering hit", () => {
    const registerBounce = vi.fn(() => ({ status: "triggered" as const }))
    const position = { x: 1, y: 2, z: 3 }
    useMultiballStore.setState({ registerBounce })

    registerBonusZoneHit("ball-a", { bounceThreshold: 9, ballCount: 4 }, position)

    expect(useScorePopupsStore.getState().popups.at(-1)).toMatchObject({
      kind: "multiball-trigger",
      text: "MULTIBALL",
      position,
    })
    expect(useScorePopupsStore.getState().popups).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ text: "0" })]),
    )
  })

  it("does not spawn a popup when the hit is ignored", () => {
    const registerBounce = vi.fn(() => ({ status: "ignored" as const }))
    useMultiballStore.setState({ registerBounce })

    registerBonusZoneHit("ball-a", { bounceThreshold: 9, ballCount: 4 }, { x: 1, y: 2, z: 3 })

    expect(useScorePopupsStore.getState().popups).toHaveLength(0)
  })
})
