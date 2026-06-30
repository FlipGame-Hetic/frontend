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
        broadcastEvent({ event_type: "Bumper", payload: { ball_id: "ball-0" } })
      }).not.toThrow()
    })
  })

  describe("broadcastEvent — after registration", () => {
    it("calls the registered send function exactly once", () => {
      const mockSend = vi.fn()
      registerScreenSender("front_screen", mockSend)

      broadcastEvent({ event_type: "Bumper", payload: { ball_id: "ball-5" } })

      expect(mockSend).toHaveBeenCalledOnce()
    })

    it("sends a ScreenEnvelope with the correct shape", () => {
      const mockSend = vi.fn()
      registerScreenSender("front_screen", mockSend)

      broadcastEvent({ event_type: "Bumper", payload: { ball_id: "ball-5" } })

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining<Partial<ScreenEnvelope>>({
          from: "front_screen",
          to: { kind: "broadcast" },
          event_type: "Bumper",
        }),
      )
    })

    it("correctly maps the payload", () => {
      const mockSend = vi.fn()
      registerScreenSender("front_screen", mockSend)

      broadcastEvent({ event_type: "Bumper", payload: { ball_id: "ball-8" } })

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ payload: { ball_id: "ball-8" } }),
      )
    })
  })

  describe("registerScreenSender — re-registration", () => {
    it("replaces the previous sender", () => {
      const oldSend = vi.fn()
      const newSend = vi.fn()

      registerScreenSender("front_screen", oldSend)
      registerScreenSender("front_screen", newSend)
      broadcastEvent({ event_type: "Bumper", payload: { ball_id: "ball-3" } })

      expect(oldSend).not.toHaveBeenCalled()
      expect(newSend).toHaveBeenCalledOnce()
    })
  })
})
