import { useEffect } from "react"
import type { ConnectionStatus, ScreenEnvelope, ScreenId } from "@frontend/types"
import { DEFAULT_SCREEN_HUB_URL, resolveScreenHubUrl } from "./wsConfig"
import { redactToken, wsLog, wsWarn } from "./wsLog"
import { useReconnectingSocket } from "./useReconnectingSocket"

export interface UseScreenHubOptions {
  screenId: ScreenId
  token: string
  baseUrl?: string
  onEvent?: (envelope: ScreenEnvelope) => void
}

export interface UseScreenHubReturn {
  status: ConnectionStatus
  send: (envelope: ScreenEnvelope) => void
}

export function useScreenHub(options: UseScreenHubOptions): UseScreenHubReturn {
  const { screenId, token } = options

  const scope = `screen:${screenId}`

  const baseUrl = token ? resolveScreenHubUrl(options.baseUrl) : DEFAULT_SCREEN_HUB_URL

  const wsUrl = `${baseUrl}/ws/screen/${screenId}?token=${token}`

  useEffect(() => {
    if (!token) {
      wsWarn(scope, "NOT connecting — VITE_SCREEN_TOKEN is empty, screen hub disabled")
    } else {
      wsLog(scope, `token=${redactToken(token)}`)
    }
  }, [token, scope])

  return useReconnectingSocket<ScreenEnvelope>({
    url: wsUrl,
    scope,
    // No token, no auth - keep the socket closed rather than looping on rejected handshakes
    enabled: Boolean(token),
    onMessage: options.onEvent,
    onParseError: (raw) => {
      wsWarn(scope, "recv <- (malformed frame, ignored)", raw)
      return undefined
    },
  })
}
