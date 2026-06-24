import type { ConnectionStatus, GameMessage } from "@frontend/types"
import { resolveGameWsUrl } from "./wsConfig"
import { useReconnectingSocket } from "./useReconnectingSocket"

export interface UseGameSocketOptions {
  url?: string
  onMessage?: (message: GameMessage) => void
}

export interface UseGameSocketReturn {
  status: ConnectionStatus
  send: (message: GameMessage) => void
}

export function useGameSocket(options?: UseGameSocketOptions): UseGameSocketReturn {
  const wsUrl = resolveGameWsUrl(options?.url)

  return useReconnectingSocket<GameMessage>({
    url: wsUrl,
    onMessage: options?.onMessage,
    // Surface unparseable frames as a 'Raw' message instead of dropping them
    onParseError: (raw) => ({
      dir: "inbound",
      device_id: "unknown",
      _type: "Raw",
      data: raw,
    }),
  })
}
