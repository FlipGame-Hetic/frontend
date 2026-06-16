import { afterEach, describe, expect, it, vi } from "vitest"
import {
  BONUS_ZONE_COOLDOWN_MS,
  BONUS_ZONE_SPAWN_INTERVAL_MS,
  MULTIBALL_SPAWN_POSITION1,
  MULTIBALL_SPAWN_POSITION2,
} from "@/components/playfield/bonusZoneConfig"
import { registerBonusZoneHit } from "@/components/playfield/bonusZoneHits"
import useMultiballStore from "@/stores/useMultiballStore"

const originalRegisterBounce = useMultiballStore.getState().registerBounce

describe("bonusZoneHits", () => {
  afterEach(() => {
    useMultiballStore.setState({ registerBounce: originalRegisterBounce })
  })

  it("registers bonus hits through the shared multiball counter", () => {
    const registerBounce = vi.fn()
    useMultiballStore.setState({ registerBounce })

    registerBonusZoneHit("ball-a", { bounceThreshold: 7, ballCount: 4 })

    expect(registerBounce).toHaveBeenCalledWith(
      "ball-a",
      7,
      [...MULTIBALL_SPAWN_POSITION1],
      [...MULTIBALL_SPAWN_POSITION2],
      BONUS_ZONE_SPAWN_INTERVAL_MS,
      BONUS_ZONE_COOLDOWN_MS,
      4,
    )
  })

  it("ignores hits without a ball id", () => {
    const registerBounce = vi.fn()
    useMultiballStore.setState({ registerBounce })

    registerBonusZoneHit("", { bounceThreshold: 7, ballCount: 4 })

    expect(registerBounce).not.toHaveBeenCalled()
  })
})
