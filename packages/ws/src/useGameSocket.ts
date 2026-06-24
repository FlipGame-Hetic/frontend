import type { ConnectionStatus, GameMessage } from "@frontend/types"
import { resolveGameWsUrl } from "./wsConfig"
import { wsWarn } from "./wsLog"
import { useReconnectingSocket } from "./useReconnectingSocket"

const SCOPE = "bridge"

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
    scope: SCOPE,
    onMessage: options?.onMessage,
    // Surface unparseable frames as a 'Raw' message instead of dropping them
    onParseError: (raw) => {
      wsWarn(SCOPE, "recv <- (unparseable raw frame)", raw)
      return {
        dir: "inbound",
        device_id: "unknown",
        _type: "Raw",
        data: raw,
      }
    },
  })
}
