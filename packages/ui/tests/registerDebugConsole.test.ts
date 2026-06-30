import { beforeEach, describe, expect, it } from "vitest"
import { useDebugOverlayStore } from "../src/debug/useDebugOverlayStore"
import { registerDebugConsole } from "../src/debug/registerDebugConsole"

beforeEach(() => {
  useDebugOverlayStore.setState({ visible: false })
})

describe("registerDebugConsole", () => {
  it("toggles overlay visibility and reports status by default", () => {
    registerDebugConsole()
    expect(window.debug()).toBe("debug overlay ON")
    expect(useDebugOverlayStore.getState().visible).toBe(true)
    expect(window.debug()).toBe("debug overlay OFF")
    expect(useDebugOverlayStore.getState().visible).toBe(false)
  })

  it("lets a handler short-circuit the command without toggling", () => {
    registerDebugConsole(() => "handled")
    expect(window.debug({ foo: 1 })).toBe("handled")
    expect(useDebugOverlayStore.getState().visible).toBe(false)
  })

  it("falls through to the default toggle when the handler returns undefined", () => {
    registerDebugConsole(() => undefined)
    expect(window.debug()).toBe("debug overlay ON")
    expect(useDebugOverlayStore.getState().visible).toBe(true)
  })
})
