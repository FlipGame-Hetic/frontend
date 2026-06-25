import type { ConnectionStatus, ScreenEnvelope, ScreenId } from "@frontend/types"
import { DEFAULT_SCREEN_HUB_URL, resolveScreenHubUrl } from "./wsConfig"
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

  const baseUrl = token ? resolveScreenHubUrl(options.baseUrl) : DEFAULT_SCREEN_HUB_URL

  const wsUrl = `${baseUrl}/ws/screen/${screenId}?token=${token}`

  return useReconnectingSocket<ScreenEnvelope>({
    url: wsUrl,
    // No token, no auth - keep the socket closed rather than looping on rejected handshakes
    enabled: Boolean(token),
    onMessage: options.onEvent,
  })
}
