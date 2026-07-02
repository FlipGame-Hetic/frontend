import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { GAME_PHASE } from "@frontend/types"
import { useDmdDevControls } from "@/dmd/useDmdDevControls"

const { useControlsMock } = vi.hoisted(() => ({
  useControlsMock: vi.fn(),
}))

vi.mock("leva", () => ({
  useControls: useControlsMock,
}))

describe("useDmdDevControls", () => {
  it("derives 16:9 rows from the configured columns and returns the selected dev phase", () => {
    useControlsMock.mockReturnValue({
      scene: GAME_PHASE.Playing,
      cols: 160,
      dotColor: "#00F0FF",
      gapRatio: 0.1,
      offOpacity: 0.03,
    })

    const { result } = renderHook(() => useDmdDevControls())

    expect(result.current).toEqual({
      config: {
        cols: 160,
        rows: 90,
        dotColor: "#00F0FF",
        bgColor: "#000000",
        offOpacity: 0.03,
        gapRatio: 0.1,
      },
      devPhase: GAME_PHASE.Playing,
    })
  })
})
