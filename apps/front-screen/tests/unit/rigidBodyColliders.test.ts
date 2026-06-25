import { describe, expect, it, vi } from "vitest"
import { setBodyCollidersEnabled } from "@/components/physics/collision/rigidBodyColliders"

describe("setBodyCollidersEnabled", () => {
  it("sets every collider enabled state", () => {
    const setEnabledA = vi.fn()
    const setEnabledB = vi.fn()
    const body = {
      numColliders: () => 2,
      collider: (index: number) =>
        [{ setEnabled: setEnabledA }, { setEnabled: setEnabledB }][index],
    }

    setBodyCollidersEnabled(body as never, false)

    expect(setEnabledA).toHaveBeenCalledWith(false)
    expect(setEnabledB).toHaveBeenCalledWith(false)
  })

  it("ignores missing bodies", () => {
    expect(() => {
      setBodyCollidersEnabled(null, true)
    }).not.toThrow()
  })
})
