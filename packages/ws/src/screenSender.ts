import type { ScreenEvent, ScreenId } from "@frontend/types"
import { makeEnvelope } from "@frontend/types"
import type { UseScreenHubReturn } from "./useScreenHub"
import { wsLog, wsWarn } from "./wsLog"

const SCOPE = "sender"

type SendFn = UseScreenHubReturn["send"]

let _screenId: ScreenId | null = null
let _send: SendFn | null = null

export function registerScreenSender(screenId: ScreenId, send: SendFn): void {
  _screenId = screenId
  _send = send
  wsLog(SCOPE, `registered sender for "${screenId}"`)
}

export function broadcastEvent(event: ScreenEvent): void {
  if (!_screenId || !_send) {
    wsWarn(SCOPE, "broadcastEvent dropped — no sender registered yet", event)
    return
  }
  wsLog(SCOPE, `broadcast "${event.event_type}"`, event)
  _send(makeEnvelope(_screenId, { kind: "broadcast" }, event))
}

export function sendEventTo(targetId: ScreenId, event: ScreenEvent): void {
  if (!_screenId || !_send) {
    wsWarn(SCOPE, `sendEventTo("${targetId}") dropped — no sender registered yet`, event)
    return
  }
  wsLog(SCOPE, `sendTo "${targetId}" "${event.event_type}"`, event)
  _send(makeEnvelope(_screenId, { kind: "screen", id: targetId }, event))
}
