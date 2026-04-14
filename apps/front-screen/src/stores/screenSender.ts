/**
 * Module-level singleton for the screen hub send function.
 * Initialized by useScreenHub once the WebSocket is ready.
 * Allows components (e.g. Bumper) to send screen envelopes
 * without prop-drilling.
 */
import type { ScreenEnvelope } from "@frontend/types"

type SendFn = (envelope: ScreenEnvelope) => void

let _send: SendFn | null = null

export function registerScreenSend(fn: SendFn): void {
  _send = fn
}

export function sendBumperHit(bumperId: number): void {
  if (!_send) return
  const envelope: ScreenEnvelope = {
    from: "front_screen",
    to: { kind: "broadcast" },
    event_type: "Bumper",
    payload: { bumper_id: bumperId },
  }
  _send(envelope)
}
