import { useCallback, useEffect, useRef, useState } from "react"
import type { ConnectionStatus, GameMessage } from "@frontend/types"
import { nextBackoffDelay, resolveGameWsUrl } from "./wsConfig"
import { wsLog, wsWarn } from "./wsLog"

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

  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const reconnectAttempt = useRef(0)
  const onMessageRef = useRef(options?.onMessage)

  useEffect(() => {
    onMessageRef.current = options?.onMessage
  })

  const send = useCallback((message: GameMessage) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      wsLog(SCOPE, "send ->", message)
      ws.send(JSON.stringify(message))
    } else {
      wsWarn(SCOPE, `send dropped (socket not open, readyState=${String(ws?.readyState)})`, message)
    }
  }, [])

  useEffect(() => {
    let disposed = false

    function connect() {
      if (disposed) return
      setStatus("connecting")
      wsLog(SCOPE, "connecting to", wsUrl)

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (disposed) return
        reconnectAttempt.current = 0
        setStatus("connected")
        wsLog(SCOPE, "OPEN ✓", wsUrl)
      }

      ws.onmessage = (event: MessageEvent) => {
        if (disposed) return
        const raw = typeof event.data === "string" ? event.data : ""
        try {
          const parsed = JSON.parse(raw) as GameMessage
          wsLog(SCOPE, "recv <-", parsed)
          onMessageRef.current?.(parsed)
        } catch {
          wsWarn(SCOPE, "recv <- (unparseable raw frame)", raw)
          onMessageRef.current?.({
            dir: "inbound",
            device_id: "unknown",
            _type: "Raw",
            data: raw,
          })
        }
      }

      ws.onclose = (event: CloseEvent) => {
        if (disposed) return
        setStatus("disconnected")
        const delay = nextBackoffDelay(reconnectAttempt.current++)
        wsWarn(
          SCOPE,
          `CLOSED code=${String(event.code)} reason="${event.reason}" wasClean=${String(event.wasClean)} — reconnecting in ${String(delay)}ms`,
        )
        reconnectTimer.current = setTimeout(connect, delay)
      }

      ws.onerror = () => {
        // onerror is always followed by onclose — let onclose handle reconnect
        wsWarn(SCOPE, "ERROR on", wsUrl)
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
