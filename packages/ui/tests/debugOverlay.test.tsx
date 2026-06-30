import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@frontend/utils", () => ({
  runtimeEnvironment: { isProduction: false },
}))

import { runtimeEnvironment } from "@frontend/utils"
import { useDebugOverlayStore } from "../src/debug/useDebugOverlayStore"
import { useDebugOverlayShown } from "../src/debug/useDebugOverlayShown"

const setProduction = (value: boolean) => {
  ;(runtimeEnvironment as { isProduction: boolean }).isProduction = value
}

beforeEach(() => {
  setProduction(false)
  useDebugOverlayStore.setState({ visible: false })
})

describe("useDebugOverlayStore", () => {
  it("toggles visibility", () => {
    expect(useDebugOverlayStore.getState().visible).toBe(false)
    act(() => {
      useDebugOverlayStore.getState().toggle()
    })
    expect(useDebugOverlayStore.getState().visible).toBe(true)
  })
})

describe("useDebugOverlayShown", () => {
  it("is shown outside production regardless of the toggle", () => {
    const { result } = renderHook(() => useDebugOverlayShown())
    expect(result.current).toBe(true)
  })

  it("is hidden in production until toggled visible", () => {
    setProduction(true)
    const { result } = renderHook(() => useDebugOverlayShown())
    expect(result.current).toBe(false)
    act(() => {
      useDebugOverlayStore.getState().toggle()
    })
    expect(result.current).toBe(true)
  })
})
