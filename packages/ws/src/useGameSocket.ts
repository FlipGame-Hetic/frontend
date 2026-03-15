import { useCallback, useEffect, useRef, useState } from "react"
import type { ConnectionStatus, GameMessage } from "@frontend/types"

const DEFAULT_WS_URL = "ws://localhost:8080/ws/bridge"
const RECONNECT_DELAY_MS = 3000

export interface UseGameSocketOptions {
  url?: string
  onMessage?: (message: GameMessage) => void
}

export interface UseGameSocketReturn {
  status: ConnectionStatus
  send: (message: GameMessage) => void
}

export function useGameSocket(options?: UseGameSocketOptions): UseGameSocketReturn {
  const wsUrl =
    options?.url ??
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_WS_URL ??
    DEFAULT_WS_URL

  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onMessageRef = useRef(options?.onMessage)

  useEffect(() => {
    onMessageRef.current = options?.onMessage
  })

  const send = useCallback((message: GameMessage) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }, [])

  useEffect(() => {
    let disposed = false

    function connect() {
      if (disposed) return
      setStatus("connecting")

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (disposed) return
        setStatus("connected")
      }

      ws.onmessage = (event: MessageEvent) => {
        if (disposed) return
        const raw = typeof event.data === "string" ? event.data : ""
        try {
          const parsed = JSON.parse(raw) as GameMessage
          onMessageRef.current?.(parsed)
        } catch {
          onMessageRef.current?.({
            dir: "inbound",
            device_id: "unknown",
            _type: "Raw",
            data: raw,
          })
        }
      }

      ws.onclose = () => {
        if (disposed) return
        setStatus("disconnected")
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS)
      }

      ws.onerror = () => {
        // onerror is always followed by onclose — let onclose handle reconnect
        ws.close()
      }
    }

    connect()

    return () => {
      disposed = true
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [wsUrl])

  return { status, send }
}
