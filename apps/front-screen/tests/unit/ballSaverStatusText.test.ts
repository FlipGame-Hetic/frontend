import { describe, expect, it } from "vitest"
import {
  BALL_SAVER_READY_TEXT,
  BALL_SAVER_TARGET_IDS,
  getBallSaverStatusText,
  getBallSaverTargetsRemaining,
  type BallSaverPhase,
} from "@/components/ballSavers/ballSaverConfig"

describe("ball saver status text", () => {
  it("shows the full target count for each side before any target falls", () => {
    expect(getBallSaverTargetsRemaining("left", [])).toBe(4)
    expect(getBallSaverTargetsRemaining("right", [])).toBe(3)

    expect(getBallSaverStatusText("left", [], "down")).toBe("4")
    expect(getBallSaverStatusText("right", [], "down")).toBe("3")
  })

  it("counts down remaining targets for the matching side only", () => {
    const activatedTargetIds = [
      BALL_SAVER_TARGET_IDS.left[0],
      BALL_SAVER_TARGET_IDS.left[1],
      BALL_SAVER_TARGET_IDS.right[0],
    ].filter((id): id is string => id !== undefined)

    expect(getBallSaverStatusText("left", activatedTargetIds, "down")).toBe("2")
    expect(getBallSaverStatusText("right", activatedTargetIds, "down")).toBe("2")
  })

  it("shows BALL SAVER while ready and hides while consumed", () => {
    const activatedTargetIds = [...BALL_SAVER_TARGET_IDS.left]
    const visiblePhases: BallSaverPhase[] = ["down", "rising", "active"]
    const hiddenPhases: BallSaverPhase[] = ["retracting", "cooldown"]

    visiblePhases.forEach((phase) => {
      expect(getBallSaverStatusText("left", activatedTargetIds, phase)).toBe(BALL_SAVER_READY_TEXT)
    })

    hiddenPhases.forEach((phase) => {
      expect(getBallSaverStatusText("left", activatedTargetIds, phase)).toBeNull()
    })
  })

  it("returns the full count again after the side targets reset", () => {
    expect(getBallSaverStatusText("left", [], "down")).toBe("4")
    expect(getBallSaverStatusText("right", [], "down")).toBe("3")
  })
})
