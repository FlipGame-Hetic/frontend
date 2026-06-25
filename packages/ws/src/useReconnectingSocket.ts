import { useCallback, useEffect, useRef, useState } from "react"
import type { ConnectionStatus } from "@frontend/types"
import { nextBackoffDelay } from "./wsConfig"

export interface UseReconnectingSocketOptions<T> {
  url: string
  // When false the socket stays closed (e.g. missing auth token) — no connect, no reconnect
  enabled?: boolean
  onMessage?: (message: T) => void
  // Called when a frame fails to parse; return a fallback message to forward, or undefined to drop it
  onParseError?: (raw: string) => T | undefined
}

export interface UseReconnectingSocketReturn<T> {
  status: ConnectionStatus
  send: (message: T) => void
}

export function useReconnectingSocket<T>(
  options: UseReconnectingSocketOptions<T>,
): UseReconnectingSocketReturn<T> {
  const { url, enabled = true } = options

  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  // Active socket kept in a ref so send and teardown reach it without re-rendering
  const wsRef = useRef<WebSocket | null>(null)
  // Handle to the pending reconnect so unMount can cancel it before it fires
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const reconnectAttempt = useRef(0)
  // Latest handlers held in refs so a new callback identity does not re-run the connect effect below
  const onMessageRef = useRef(options.onMessage)
  const onParseErrorRef = useRef(options.onParseError)

  useEffect(() => {
    onMessageRef.current = options.onMessage
    onParseErrorRef.current = options.onParseError
    // No dependency : runs on every render to keep the refs pointing at the current handlers
  })

  // Stable identity: reaches the live socket through wsRef instead of closing over it
  const send = useCallback((message: T) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    // Flipped true by cleanup so async socket callbacks stop acting after unmount
    let disposed = false

    function connect() {
      if (disposed) return
      setStatus("connecting")

      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (disposed) return
        reconnectAttempt.current = 0
        setStatus("connected")
      }

      ws.onmessage = (event: MessageEvent) => {
        if (disposed) return
        const raw = typeof event.data === "string" ? event.data : ""
        try {
          const parsed = JSON.parse(raw) as T
          onMessageRef.current?.(parsed)
        } catch {
          const fallback = onParseErrorRef.current?.(raw)
          if (fallback !== undefined) onMessageRef.current?.(fallback)
        }
      }

      ws.onclose = () => {
        if (disposed) return
        setStatus("disconnected")
        // Increases the delay before next attempt
        const delay = nextBackoffDelay(reconnectAttempt.current++)
        reconnectTimer.current = setTimeout(connect, delay)
      }

      ws.onerror = () => {
        // onerror is always followed by onclose - let onclose handle reconnect
        ws.close()
      }
    }

    connect()

    return () => {
      disposed = true
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [url, enabled])

  return { status, send }
}
