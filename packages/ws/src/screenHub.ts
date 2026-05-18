import { useCallback } from "react"
import type { ScreenEnvelope, ScreenEvent, ScreenId } from "@frontend/types"
import { makeEnvelope } from "@frontend/types"
import { useScreenSocket, type UseScreenSocketReturn } from "./useScreenSocket"

export interface UseScreenHubOptions {
  screenId: ScreenId
  token: string
  baseUrl?: string
  onEvent?: (envelope: ScreenEnvelope) => void
}

export interface UseScreenHubReturn extends UseScreenSocketReturn {
  broadcast: (event: ScreenEvent) => void
  sendTo: (targetId: ScreenId, event: ScreenEvent) => void
}

export function useScreenHub(options: UseScreenHubOptions): UseScreenHubReturn {
  const { screenId, token, baseUrl, onEvent } = options

  const socket = useScreenSocket({
    screenId,
    token,
    baseUrl,
    onMessage: onEvent,
  })

  const broadcast = useCallback(
    (event: ScreenEvent) => {
      socket.send(makeEnvelope(screenId, { kind: "broadcast" }, event))
    },
    [socket, screenId],
  )

  const sendTo = useCallback(
    (targetId: ScreenId, event: ScreenEvent) => {
      socket.send(makeEnvelope(screenId, { kind: "screen", id: targetId }, event))
    },
    [socket, screenId],
  )

  return { ...socket, broadcast, sendTo }
}
