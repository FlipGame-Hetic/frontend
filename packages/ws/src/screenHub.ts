import type { ScreenEnvelope, ScreenId } from "@frontend/types"
import { useScreenSocket, type UseScreenSocketReturn } from "./useScreenSocket"

export interface UseScreenHubOptions {
  screenId: ScreenId
  token: string
  baseUrl?: string
  onEvent?: (envelope: ScreenEnvelope) => void
}

export type UseScreenHubReturn = UseScreenSocketReturn

export function useScreenHub(options: UseScreenHubOptions): UseScreenHubReturn {
  const { screenId, token, baseUrl, onEvent } = options

  return useScreenSocket({
    screenId,
    token,
    baseUrl,
    onMessage: onEvent,
  })
}
