import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ScreenEnvelope, ScreenEvent, ScreenId } from "@frontend/types"

describe("screenSender", () => {
  let registerScreenSender: (id: ScreenId, fn: (e: ScreenEnvelope) => void) => void
  let broadcastEvent: (event: ScreenEvent) => void

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import("@frontend/ws")
    registerScreenSender = mod.registerScreenSender
    broadcastEvent = mod.broadcastEvent
  })

  describe("broadcastEvent — no sender registered", () => {
    it("is a silent no-op and does not throw", () => {
      expect(() => {
        broadcastEvent({ event_type: "bumper_hit", payload: { bumper_id: 0 } })
      }).not.toThrow()
    })
  })

  describe("broadcastEvent — after registration", () => {
    it("calls the registered send function exactly once", () => {
      const mockSend = vi.fn()
      registerScreenSender("front_screen", mockSend)

      broadcastEvent({ event_type: "bumper_hit", payload: { bumper_id: 5 } })

      expect(mockSend).toHaveBeenCalledOnce()
    })

    it("sends a ScreenEnvelope with the correct shape", () => {
      const mockSend = vi.fn()
      registerScreenSender("front_screen", mockSend)

      broadcastEvent({ event_type: "bumper_hit", payload: { bumper_id: 5 } })

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining<Partial<ScreenEnvelope>>({
          from: "front_screen",
          to: { kind: "broadcast" },
          event_type: "bumper_hit",
        }),
      )
    })

    it("correctly maps bumper_id in the payload", () => {
      const mockSend = vi.fn()
      registerScreenSender("front_screen", mockSend)

      broadcastEvent({ event_type: "bumper_hit", payload: { bumper_id: 8 } })

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ payload: { bumper_id: 8 } }))
    })
  })

  describe("registerScreenSender — re-registration", () => {
    it("replaces the previous sender", () => {
      const oldSend = vi.fn()
      const newSend = vi.fn()

      registerScreenSender("front_screen", oldSend)
      registerScreenSender("front_screen", newSend)
      broadcastEvent({ event_type: "bumper_hit", payload: { bumper_id: 3 } })

      expect(oldSend).not.toHaveBeenCalled()
      expect(newSend).toHaveBeenCalledOnce()
    })
  })
})
