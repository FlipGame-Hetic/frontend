import type { ScreenEvent, ScreenId } from "@frontend/types"
import { makeEnvelope } from "@frontend/types"
import type { UseScreenSocketReturn } from "./useScreenSocket"

type SendFn = UseScreenSocketReturn["send"]

let _screenId: ScreenId | null = null
let _send: SendFn | null = null

export function registerScreenSender(screenId: ScreenId, send: SendFn): void {
  _screenId = screenId
  _send = send
}

export function broadcastEvent(event: ScreenEvent): void {
  if (!_screenId || !_send) return
  _send(makeEnvelope(_screenId, { kind: "broadcast" }, event))
}

export function sendEventTo(targetId: ScreenId, event: ScreenEvent): void {
  if (!_screenId || !_send) return
  _send(makeEnvelope(_screenId, { kind: "screen", id: targetId }, event))
}
