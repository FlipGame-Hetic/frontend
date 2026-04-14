import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ScreenEnvelope } from "@frontend/types"

/**
 * Tests for screenSender.ts — the module-level singleton that
 * bridges the screen WebSocket send function to physics components.
 *
 * Each test group uses vi.resetModules() + dynamic import to start
 * with a clean _send = null state (the module variable persists
 * across static imports within the same test run).
 */
describe("screenSender", () => {
  let registerScreenSend: (fn: (e: ScreenEnvelope) => void) => void
  let sendBumperHit: (id: number) => void

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import("@/stores/screenSender")
    registerScreenSend = mod.registerScreenSend
    sendBumperHit = mod.sendBumperHit
  })

  // ─── No-op (before registration) ───────────────────────────────────────────

  describe("sendBumperHit — no sender registered", () => {
    it("is a silent no-op and does not throw", () => {
      expect(() => {
        sendBumperHit(0)
      }).not.toThrow()
    })

    it("does not attempt to call any function", () => {
      // Verify by checking that calling multiple times still does not throw
      expect(() => {
        sendBumperHit(0)
        sendBumperHit(5)
        sendBumperHit(8)
      }).not.toThrow()
    })
  })

  // ─── Success ────────────────────────────────────────────────────────────────

  describe("sendBumperHit — after registration", () => {
    it("calls the registered send function exactly once", () => {
      const mockSend = vi.fn()
      registerScreenSend(mockSend)

      sendBumperHit(5)

      expect(mockSend).toHaveBeenCalledOnce()
    })

    it("sends a ScreenEnvelope with the correct shape and bumper_id", () => {
      const mockSend = vi.fn()
      registerScreenSend(mockSend)

      sendBumperHit(5)

      const expected: ScreenEnvelope = {
        from: "front_screen",
        to: { kind: "broadcast" },
        event_type: "Bumper",
        payload: { bumper_id: 5 },
      }
      expect(mockSend).toHaveBeenCalledWith(expected)
    })

    it("correctly maps any bumper index to bumper_id in the payload", () => {
      const mockSend = vi.fn()
      registerScreenSend(mockSend)

      sendBumperHit(0)
      sendBumperHit(8)

      expect(mockSend).toHaveBeenCalledTimes(2)
      expect(mockSend).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ payload: { bumper_id: 0 } }),
      )
      expect(mockSend).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ payload: { bumper_id: 8 } }),
      )
    })

    it("always sets from='front_screen' and to.kind='broadcast'", () => {
      const mockSend = vi.fn()
      registerScreenSend(mockSend)

      sendBumperHit(3)

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining<Partial<ScreenEnvelope>>({
          from: "front_screen",
          to: { kind: "broadcast" },
          event_type: "Bumper",
        }),
      )
    })
  })

  // ─── Re-registration ────────────────────────────────────────────────────────

  describe("registerScreenSend — re-registration", () => {
    it("replaces the previous sender: old send is never called", () => {
      const oldSend = vi.fn()
      const newSend = vi.fn()

      registerScreenSend(oldSend)
      registerScreenSend(newSend)
      sendBumperHit(3)

      expect(oldSend).not.toHaveBeenCalled()
    })

    it("replaces the previous sender: new send is called once", () => {
      const oldSend = vi.fn()
      const newSend = vi.fn()

      registerScreenSend(oldSend)
      registerScreenSend(newSend)
      sendBumperHit(3)

      expect(newSend).toHaveBeenCalledOnce()
    })
  })

  // ─── Exception propagation ──────────────────────────────────────────────────

  describe("sendBumperHit — sender throws", () => {
    it("propagates the exception thrown by the send function", () => {
      const wsError = new Error("WebSocket connection closed")
      registerScreenSend(() => {
        throw wsError
      })

      expect(() => {
        sendBumperHit(1)
      }).toThrow("WebSocket connection closed")
    })

    it("propagates the exact error instance (no wrapping)", () => {
      const originalError = new TypeError("serialization failed")
      registerScreenSend(() => {
        throw originalError
      })

      expect(() => {
        sendBumperHit(2)
      }).toThrow(originalError)
    })
  })
})
