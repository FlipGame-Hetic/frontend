import useScorePopupsStore from "@/stores/useScorePopupsStore"
import type { Position3Type } from "@/types/worldTypes"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/config/characterConfig", () => ({
  getCurrentBallColorSnapshot: () => "#ffffff",
}))

vi.mock("@/components/balls/runtime/ballPositionRegistry", () => ({
  getBallPosition: () => undefined,
  getAnyBallPosition: () => ({ x: 0, y: 0, z: 0 }),
}))

const POS: Position3Type = { x: 0, y: 0, z: 0 }

const scoreAmounts = () =>
  useScorePopupsStore
    .getState()
    .popups.filter((p) => p.kind === "score")
    .map((p) => p.amount)

describe("useScorePopupsStore score cap", () => {
  beforeEach(() => {
    useScorePopupsStore.setState({ popups: [], recentHits: [] })
  })

  it("drops only the oldest score popup when spawning a 9th", () => {
    for (let i = 1; i <= 9; i++) {
      useScorePopupsStore.getState().addPopup(i, POS)
    }

    const amounts = scoreAmounts()
    expect(amounts).toHaveLength(8)
    // oldest (amount 1) dropped, 2..9 kept in order
    expect(amounts).toEqual([2, 3, 4, 5, 6, 7, 8, 9])
  })

  it("never drops countdown/trigger popups and does not count them toward the cap", () => {
    const store = useScorePopupsStore.getState()
    store.spawnMultiballTriggeredPopup(POS)
    store.spawnMultiballCountdownPopup(3, POS)
    for (let i = 1; i <= 9; i++) {
      store.addPopup(i, POS)
    }

    const popups = useScorePopupsStore.getState().popups
    expect(popups.filter((p) => p.kind === "multiball-trigger")).toHaveLength(1)
    expect(popups.filter((p) => p.kind === "multiball-countdown")).toHaveLength(1)
    // exactly the cap of score popups, oldest score dropped
    expect(scoreAmounts()).toEqual([2, 3, 4, 5, 6, 7, 8, 9])
  })

  it("leaves under-cap spawns untouched and preserves order", () => {
    for (let i = 1; i <= 5; i++) {
      useScorePopupsStore.getState().addPopup(i, POS)
    }

    expect(scoreAmounts()).toEqual([1, 2, 3, 4, 5])
  })

  it("no-ops on spawnPopupFromDelta with amount 0", () => {
    useScorePopupsStore.getState().spawnPopupFromDelta(0, "bumper", "ball-a")

    expect(useScorePopupsStore.getState().popups).toHaveLength(0)
  })
})
