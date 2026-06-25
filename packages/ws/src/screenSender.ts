import type { ScreenEvent, ScreenId } from "@frontend/types"
import { makeEnvelope } from "@frontend/types"
import type { UseScreenHubReturn } from "./useScreenHub"

type SendFn = UseScreenHubReturn["send"]

let _screenId: ScreenId | null = null
let _send: SendFn | null = null

export function registerScreenSender(screenId: ScreenId, send: SendFn): void {
  _screenId = screenId
  _send = send
}

// Module-level bridge so non-React code (collision callbacks, stores) can reach the socket the hook owns - not a second emitter
export function broadcastEvent(event: ScreenEvent): void {
  if (!_screenId || !_send) {
    console.warn("[ws] broadcastEvent dropped — no sender registered yet", event)
    return
  }
  _send(makeEnvelope(_screenId, { kind: "broadcast" }, event))
}

export function sendEventTo(targetId: ScreenId, event: ScreenEvent): void {
  if (!_screenId || !_send) {
    console.warn(`[ws] sendEventTo("${targetId}") dropped — no sender registered yet`, event)
    return
  }
  _send(makeEnvelope(_screenId, { kind: "screen", id: targetId }, event))
}
